// Database utilities for Cypress tests
const { Client } = require('pg')

const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: process.env.POSTGRES_PORT || 5433,
  database: process.env.POSTGRES_DB || 'docling_test',
  user: process.env.POSTGRES_USER || 'test_user',
  password: process.env.POSTGRES_PASSWORD || 'test_pass'
}

async function seedDatabase() {
  const client = new Client(dbConfig)
  
  try {
    await client.connect()
    
    // Insert test user
    await client.query(`
      INSERT INTO users (id, email, created_at, updated_at) 
      VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'test@example.com',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
      ) ON CONFLICT (email) DO NOTHING
    `)
    
    // Insert test API key (hashed version of 'test-api-key-123')
    await client.query(`
      INSERT INTO api_keys (id, user_id, name, key_hash, created_at, is_active)
      VALUES (
        '550e8400-e29b-41d4-a716-446655440001',
        '550e8400-e29b-41d4-a716-446655440000',
        'Test API Key',
        '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj3bp.Gm.QG2',
        CURRENT_TIMESTAMP,
        true
      ) ON CONFLICT (id) DO NOTHING
    `)
    
    // Insert test webhook configuration
    await client.query(`
      INSERT INTO webhook_configs (id, user_id, url, secret, is_active, created_at)
      VALUES (
        '550e8400-e29b-41d4-a716-446655440002',
        '550e8400-e29b-41d4-a716-446655440000',
        'http://localhost:9999/webhook',
        'test-webhook-secret',
        true,
        CURRENT_TIMESTAMP
      ) ON CONFLICT (id) DO NOTHING
    `)
    
    console.log('Test database seeded successfully')
    return true
  } catch (error) {
    console.error('Error seeding database:', error)
    throw error
  } finally {
    await client.end()
  }
}

async function cleanDatabase() {
  const client = new Client(dbConfig)
  
  try {
    await client.connect()
    
    // Clean up in reverse order of dependencies
    await client.query('DELETE FROM webhook_deliveries')
    await client.query('DELETE FROM processing_results')
    await client.query('DELETE FROM processing_jobs')
    await client.query('DELETE FROM webhook_configs')
    await client.query('DELETE FROM api_keys')
    await client.query('DELETE FROM users')
    
    console.log('Test database cleaned successfully')
    return true
  } catch (error) {
    console.error('Error cleaning database:', error)
    throw error
  } finally {
    await client.end()
  }
}

module.exports = {
  seedDatabase,
  cleanDatabase
}