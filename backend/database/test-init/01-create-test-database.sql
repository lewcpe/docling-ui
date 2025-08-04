-- Test database initialization
-- This script runs during test PostgreSQL container initialization

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables (same as production but for testing)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    key_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_used_at TIMESTAMP,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS webhook_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(2048) NOT NULL,
    secret VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    original_filename VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    status VARCHAR(50) DEFAULT 'queued',
    progress INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT
);

CREATE TABLE IF NOT EXISTS processing_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    extracted_text TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES processing_jobs(id) ON DELETE CASCADE,
    webhook_url VARCHAR(2048) NOT NULL,
    status VARCHAR(50) NOT NULL,
    attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP,
    response_code INTEGER,
    response_body TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_webhook_configs_user_id ON webhook_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_user_id ON processing_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_processing_jobs_status ON processing_jobs(status);
CREATE INDEX IF NOT EXISTS idx_processing_results_job_id ON processing_results(job_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_job_id ON webhook_deliveries(job_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);