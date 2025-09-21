const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'project_phoenix',
  password: process.env.DB_PASSWORD || 'password',
  port: process.env.DB_PORT || 5432,
});

async function setupDatabase() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Setting up Meesho Rebound database...');
    
    // Create database if not exists (this might need to be done manually)
    console.log('✅ Database connection established');
    
    // Test connection
    const result = await client.query('SELECT NOW()');
    console.log('✅ Database connection test successful:', result.rows[0].now);
    
    console.log('🚀 Database setup complete!');
    console.log('📝 Next steps:');
    console.log('   1. Run the schema.sql file to create tables');
    console.log('   2. Run the seed-data.sql file to populate sample data');
    console.log('   3. Start the backend server with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
  } finally {
    client.release();
    process.exit(0);
  }
}

setupDatabase();