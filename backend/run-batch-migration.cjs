const mysql = require('mysql2/promise');
require('dotenv').config();

async function runBatchMigration() {
  let connection;
  
  try {
    // Create connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_platform',
      port: process.env.DB_PORT || 3306
    });

    console.log('Connected to database successfully');

    // Read and execute migration file
    const fs = require('fs');
    const path = require('path');
    const migrationPath = path.join(__dirname, 'database', 'migrate_add_batch_fields.sql');
    
    if (!fs.existsSync(migrationPath)) {
      console.error('Migration file not found:', migrationPath);
      return;
    }

    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    const statements = migrationSQL.split(';').filter(stmt => stmt.trim());

    console.log(`Found ${statements.length} SQL statements to execute`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (statement) {
        try {
          console.log(`Executing statement ${i + 1}: ${statement.substring(0, 50)}...`);
          await connection.execute(statement);
          console.log(`Statement ${i + 1} executed successfully`);
        } catch (error) {
          if (error.code === 'ER_DUP_FIELDNAME') {
            console.log(`Statement ${i + 1} skipped - field already exists`);
          } else {
            console.error(`Error executing statement ${i + 1}:`, error.message);
          }
        }
      }
    }

    console.log('Batch migration completed successfully');

  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Database connection closed');
    }
  }
}

runBatchMigration();



