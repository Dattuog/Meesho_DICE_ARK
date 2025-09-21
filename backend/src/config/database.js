const { Pool } = require('pg');
const redis = require('redis');
const fs = require('fs');
const path = require('path');

// PostgreSQL connection
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_phoenix',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

// Initialize database schema
async function initializeDatabase() {
  try {
    const schemaPath = path.join(__dirname, '../../database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
      console.log('Database schema initialized successfully');
    } else {
      console.log('Schema file not found, skipping initialization');
    }
  } catch (error) {
    console.error('Error initializing database:', error.message);
  }
}

// Call initialization in demo mode
if (process.env.NODE_ENV !== 'production') {
  initializeDatabase();
}

// Redis connection (only if not disabled)
let redisClient = null;

if (!process.env.REDIS_DISABLED || process.env.REDIS_DISABLED === 'false') {
  redisClient = redis.createClient({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
  });

  redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
  });

  redisClient.connect().catch((err) => {
    console.log('Redis connection failed, continuing without Redis:', err.message);
    redisClient = null;
  });
} else {
  console.log('Redis is disabled for demo mode');
}

module.exports = {
  pool,
  redisClient
};