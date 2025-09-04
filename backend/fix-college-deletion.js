// Script to fix college deletion issues
// Run this script to add the deleted_at column and fix the database

import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: 'Admin@1234', // Updated password from env.example
  database: 'lms_platform'
};

async function fixCollegeDeletion() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connected successfully\n');

    // Step 1: Add deleted_at column
    console.log('🔧 Step 1: Adding deleted_at column...');
    try {
      await connection.execute(`
        ALTER TABLE colleges 
        ADD COLUMN deleted_at TIMESTAMP NULL DEFAULT NULL AFTER updated_at
      `);
      console.log('✅ deleted_at column added successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  deleted_at column already exists');
      } else {
        throw error;
      }
    }

    // Step 2: Add index for performance
    console.log('\n🔧 Step 2: Adding index for deleted_at...');
    try {
      await connection.execute(`
        CREATE INDEX idx_colleges_deleted_at ON colleges(deleted_at)
      `);
      console.log('✅ Index created successfully');
    } catch (error) {
      if (error.code === 'ER_DUP_KEYNAME') {
        console.log('ℹ️  Index already exists');
      } else {
        throw error;
      }
    }

    // Step 3: Update existing soft-deleted colleges
    console.log('\n🔧 Step 3: Updating existing soft-deleted colleges...');
    const [updateResult] = await connection.execute(`
      UPDATE colleges 
      SET deleted_at = updated_at 
      WHERE is_active = FALSE AND deleted_at IS NULL
    `);
    console.log(`✅ Updated ${updateResult.affectedRows} soft-deleted colleges`);

    // Step 4: Create views
    console.log('\n🔧 Step 4: Creating database views...');
    
    // Active colleges view
    try {
      await connection.execute(`
        CREATE OR REPLACE VIEW active_colleges AS
        SELECT * FROM colleges 
        WHERE is_active = TRUE AND (deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00')
      `);
      console.log('✅ active_colleges view created');
    } catch (error) {
      console.log('❌ Error creating active_colleges view:', error.message);
    }

    // Deleted colleges view
    try {
      await connection.execute(`
        CREATE OR REPLACE VIEW deleted_colleges AS
        SELECT * FROM colleges 
        WHERE is_active = FALSE OR deleted_at IS NOT NULL
      `);
      console.log('✅ deleted_colleges view created');
    } catch (error) {
      console.log('❌ Error creating deleted_colleges view:', error.message);
    }

    // Step 5: Show current status
    console.log('\n🔧 Step 5: Checking current status...');
    const [colleges] = await connection.execute(`
      SELECT 
        COUNT(*) as total_colleges,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_colleges,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as deleted_colleges,
        SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as soft_deleted_colleges
      FROM colleges
    `);

    const stats = colleges[0];
    console.log('📊 Current College Status:');
    console.log(`   Total Colleges: ${stats.total_colleges}`);
    console.log(`   Active Colleges: ${stats.active_colleges}`);
    console.log(`   Inactive Colleges: ${stats.deleted_colleges}`);
    console.log(`   Soft Deleted Colleges: ${stats.soft_deleted_colleges}`);

    // Step 6: Show deleted colleges
    console.log('\n🔧 Step 6: Listing deleted colleges...');
    const [deletedColleges] = await connection.execute(`
      SELECT name, code, is_active, deleted_at 
      FROM colleges 
      WHERE is_active = FALSE OR deleted_at IS NOT NULL
      ORDER BY deleted_at DESC
    `);

    if (deletedColleges.length > 0) {
      console.log('🗑️  Deleted Colleges:');
      deletedColleges.forEach((college, index) => {
        console.log(`   ${index + 1}. ${college.name} (${college.code})`);
        console.log(`      Status: ${college.is_active ? 'Active' : 'Inactive'}`);
        console.log(`      Deleted At: ${college.deleted_at || 'Not set'}`);
        console.log('');
      });
    } else {
      console.log('ℹ️  No deleted colleges found');
    }

    console.log('\n🎉 College deletion issues fixed successfully!');
    console.log('\n📋 What was fixed:');
    console.log('   ✅ Added deleted_at column for proper soft delete tracking');
    console.log('   ✅ Added index for better performance');
    console.log('   ✅ Updated existing soft-deleted colleges');
    console.log('   ✅ Created views for active and deleted colleges');
    console.log('   ✅ College codes can now be reused after deletion');
    console.log('\n🚀 Next steps:');
    console.log('   1. Restart your backend server');
    console.log('   2. Try creating a new college with code "CMRT"');
    console.log('   3. Use the enhanced delete/restore functions');

  } catch (error) {
    console.error('❌ Error fixing college deletion:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n🔌 Database connection closed');
    }
  }
}

// Run the fix
console.log('🚀 Starting College Deletion Fix...\n');
fixCollegeDeletion()
  .then(() => {
    console.log('\n✨ Fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });
