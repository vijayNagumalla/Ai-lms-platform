const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
require('dotenv').config();

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lms_platform',
  port: process.env.DB_PORT || 3306
};

async function runMigration() {
  let connection;
  
  try {
    console.log('Connecting to database...');
    console.log('Database config:', {
      host: dbConfig.host,
      user: dbConfig.user,
      database: dbConfig.database,
      port: dbConfig.port,
      password: dbConfig.password ? '[HIDDEN]' : '[NOT SET]'
    });
    
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Starting migration...');
    
    // Step 1: Add columns to users table
    console.log('\n1. Adding year columns to users table...');
    try {
      await connection.execute(`
        ALTER TABLE users 
        ADD COLUMN joining_year INT DEFAULT NULL AFTER student_id,
        ADD COLUMN final_year INT DEFAULT NULL AFTER joining_year,
        ADD COLUMN current_year INT DEFAULT NULL AFTER final_year,
        ADD COLUMN year_start_date DATE DEFAULT NULL AFTER current_year
      `);
      console.log('✓ Year columns added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ Some columns already exist, continuing...');
      } else {
        throw error;
      }
    }
    
    // Step 2: Add indexes
    console.log('\n2. Adding indexes...');
    const indexes = [
      'CREATE INDEX idx_joining_year ON users(joining_year)',
      'CREATE INDEX idx_final_year ON users(final_year)',
      'CREATE INDEX idx_current_year ON users(current_year)',
      'CREATE INDEX idx_year_start_date ON users(year_start_date)'
    ];
    
    for (const indexSQL of indexes) {
      try {
        await connection.execute(indexSQL);
        console.log(`✓ Index created: ${indexSQL.substring(0, 50)}...`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`ℹ Index already exists: ${indexSQL.substring(0, 50)}...`);
        } else {
          console.log(`⚠ Index creation failed: ${error.message}`);
        }
      }
    }
    
    // Step 3: Update existing students
    console.log('\n3. Updating existing students...');
    try {
      const [result] = await connection.execute(`
        UPDATE users 
        SET joining_year = 2024, 
            final_year = 2028, 
            current_year = 2024, 
            year_start_date = '2024-06-01' 
        WHERE role = 'student' AND joining_year IS NULL
      `);
      console.log(`✓ Updated ${result.affectedRows} existing students`);
    } catch (error) {
      console.log(`⚠ Update existing students failed: ${error.message}`);
    }
    
    // Step 4: Create stored procedures
    console.log('\n4. Creating stored procedures...');
    
    // Drop existing procedures if they exist
    try {
      await connection.execute('DROP PROCEDURE IF EXISTS UpdateStudentYears');
      await connection.execute('DROP PROCEDURE IF EXISTS CalculateCurrentYear');
      console.log('✓ Dropped existing procedures');
    } catch (error) {
      console.log(`ℹ No existing procedures to drop: ${error.message}`);
    }
    
    // Create UpdateStudentYears procedure
    try {
      await connection.execute(`
        CREATE PROCEDURE UpdateStudentYears()
        BEGIN
            DECLARE current_date DATE;
            DECLARE current_year INT;
            
            SET current_date = CURDATE();
            SET current_year = YEAR(current_date);
            
            UPDATE users 
            SET current_year = current_year + 1,
                year_start_date = DATE_ADD(year_start_date, INTERVAL 1 YEAR)
            WHERE role = 'student' 
              AND year_start_date IS NOT NULL 
              AND DATEDIFF(current_date, year_start_date) >= 365
              AND current_year < final_year;
                
            SELECT CONCAT('Updated ', ROW_COUNT(), ' students to year ', current_year) as result;
        END
      `);
      console.log('✓ UpdateStudentYears procedure created');
    } catch (error) {
      console.log(`✗ Failed to create UpdateStudentYears: ${error.message}`);
    }
    
    // Create CalculateCurrentYear procedure
    try {
      await connection.execute(`
        CREATE PROCEDURE CalculateCurrentYear()
        BEGIN
            DECLARE current_date DATE;
            DECLARE current_year INT;
            
            SET current_date = CURDATE();
            SET current_year = YEAR(current_date);
            
            UPDATE users 
            SET current_year = LEAST(
                joining_year + FLOOR(DATEDIFF(current_date, year_start_date) / 365),
                final_year
            )
            WHERE role = 'student' 
              AND joining_year IS NOT NULL 
              AND final_year IS NOT NULL 
              AND year_start_date IS NOT NULL;
                
            SELECT CONCAT('Calculated current year for ', ROW_COUNT(), ' students') as result;
        END
      `);
      console.log('✓ CalculateCurrentYear procedure created');
    } catch (error) {
      console.log(`✗ Failed to create CalculateCurrentYear: ${error.message}`);
    }
    
    // Step 5: Create annual event
    console.log('\n5. Creating annual event...');
    try {
      await connection.execute(`
        CREATE EVENT IF NOT EXISTS annual_student_year_update
        ON SCHEDULE EVERY 1 YEAR
        STARTS '2025-06-01 00:00:00'
        DO CALL UpdateStudentYears()
      `);
      console.log('✓ Annual event created');
    } catch (error) {
      console.log(`⚠ Event creation failed: ${error.message}`);
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- Year columns added to users table');
    console.log('- Indexes created for performance');
    console.log('- Existing students updated with default years');
    console.log('- Stored procedures created for year calculations');
    console.log('- Annual event scheduled for automatic updates');
    console.log('\n💡 You can now:');
    console.log('- Create students with joining and final years');
    console.log('- Manually update years: CALL UpdateStudentYears();');
    console.log('- Years will automatically update annually on June 1st');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run the migration
runMigration();

