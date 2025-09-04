import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lms_platform',
  port: process.env.DB_PORT || 3306
};

async function migrateCodingProfiles() {
  let connection;
  try {
    console.log('🚀 Starting coding profiles migration...');
    
    // Create database connection
    connection = await mysql.createConnection(dbConfig);
    
    // Read the schema file
    const schemaPath = path.join(__dirname, 'coding_profiles_schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split the schema into individual statements
    const statements = schema
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    // Execute each statement
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.execute(statement);
          console.log('✅ Executed:', statement.substring(0, 50) + '...');
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            console.log('⚠️  Skipped (already exists):', statement.substring(0, 50) + '...');
          } else {
            console.error('❌ Error executing statement:', error.message);
            console.error('Statement:', statement);
          }
        }
      }
    }
    
    console.log('🎉 Coding profiles migration completed successfully!');
    
    // Verify the tables were created
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('coding_platforms', 'coding_profiles', 'coding_progress', 'coding_achievements', 'coding_api_logs')
    `);
    
    console.log('📊 Created tables:', tables.map(t => t.table_name));
    
  } catch (error) {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run migration if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateCodingProfiles();
}

export default migrateCodingProfiles;
