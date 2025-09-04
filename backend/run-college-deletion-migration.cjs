const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'Admin@1234',
  database: process.env.DB_NAME || 'lms_platform',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

async function runMigration() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Connected to database successfully');

    // Read the migration SQL file
    const migrationPath = path.join(__dirname, 'database', 'migrate_add_deleted_at_to_colleges.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');

    console.log('📝 Running college deletion migration...');
    
    // Execute the migration
    const [results] = await connection.execute(migrationSQL);
    console.log('✅ Migration completed successfully');

    // Verify the changes
    console.log('🔍 Verifying migration results...');
    const [verificationResults] = await connection.execute(`
      SELECT 
        TABLE_NAME,
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'lms_platform' 
        AND TABLE_NAME IN ('colleges', 'departments', 'college_departments')
        AND COLUMN_NAME = 'deleted_at'
      ORDER BY TABLE_NAME
    `);

    console.log('\n📊 Migration Verification Results:');
    console.table(verificationResults);

    if (verificationResults.length > 0) {
      console.log('\n✅ Migration successful! The following changes were made:');
      verificationResults.forEach(result => {
        console.log(`  - ${result.TABLE_NAME}.${result.COLUMN_NAME}: ${result.DATA_TYPE} (${result.IS_NULLABLE === 'YES' ? 'nullable' : 'not null'})`);
      });
    } else {
      console.log('\n⚠️  Warning: No deleted_at columns found. Migration may have failed.');
    }

    console.log('\n🎉 College deletion migration completed!');
    console.log('Now when you delete a college:');
    console.log('  1. The college will be soft-deleted (is_active = FALSE)');
    console.log('  2. All related student data will have college_id set to NULL');
    console.log('  3. No more "Unknown College" issues in the UI');
    console.log('  4. Data integrity is maintained');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the migration
runMigration();

