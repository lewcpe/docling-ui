-- Test data for Cypress tests
-- This file is loaded into the test database during container startup

-- Insert test user
INSERT INTO users (id, email, created_at, updated_at) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440000',
  'test@example.com',
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

-- Insert test API key (hashed version of 'test-api-key-123')
INSERT INTO api_keys (id, user_id, name, key_hash, created_at, is_active)
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440000',
  'Test API Key',
  '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.QG2', -- bcrypt hash of 'test-api-key-123'
  CURRENT_TIMESTAMP,
  true
) ON CONFLICT (id) DO NOTHING;

-- Insert test webhook configuration
INSERT INTO webhook_configs (id, user_id, url, secret, is_active, created_at)
VALUES (
  '550e8400-e29b-41d4-a716-446655440002',
  '550e8400-e29b-41d4-a716-446655440000',
  'http://localhost:9999/webhook',
  'test-webhook-secret',
  true,
  CURRENT_TIMESTAMP
) ON CONFLICT (id) DO NOTHING;