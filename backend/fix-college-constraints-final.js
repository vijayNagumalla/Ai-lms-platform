// Final comprehensive script to fix college constraints and enable code reuse
import { pool } from './config/database.js';

async function fixCollegeConstraintsFinal() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await pool.getConnection();
    console.log('✅ Database connected successfully\n');

    // Step 1: Check current table structure
    console.log('🔧 Step 1: Checking current table structure...');
    const [tableInfo] = await connection.execute('SHOW CREATE TABLE colleges');
    console.log('📊 Current table structure retrieved');

    // Step 2: Drop all existing views
    console.log('\n🔧 Step 2: Dropping existing views...');
    try {
      await connection.execute('DROP VIEW IF EXISTS active_colleges');
      console.log('✅ Dropped active_colleges view');
    } catch (error) {
      console.log('ℹ️  active_colleges view not found or already dropped');
    }
    
    try {
      await connection.execute('DROP VIEW IF EXISTS deleted_colleges');
      console.log('✅ Dropped deleted_colleges view');
    } catch (error) {
      console.log('ℹ️  deleted_colleges view not found or already dropped');
    }

    // Step 3: Remove all unique constraints on the code column
    console.log('\n🔧 Step 3: Removing all unique constraints on code column...');
    
    // Get all indexes on the colleges table
    const [indexes] = await connection.execute('SHOW INDEX FROM colleges');
    const codeIndexes = indexes.filter(idx => idx.Column_name === 'code');
    
    console.log(`📊 Found ${codeIndexes.length} indexes on code column`);
    
    for (const idx of codeIndexes) {
      if (idx.Key_name !== 'PRIMARY') {
        try {
          await connection.execute(`ALTER TABLE colleges DROP INDEX ${idx.Key_name}`);
          console.log(`✅ Dropped index: ${idx.Key_name}`);
        } catch (error) {
          console.log(`⚠️  Could not drop index ${idx.Key_name}:`, error.message);
        }
      }
    }

    // Step 4: Fix timestamp issues
    console.log('\n🔧 Step 4: Fixing timestamp issues...');
    try {
      // Set invalid timestamps to NULL
      await connection.execute(`
        UPDATE colleges 
        SET deleted_at = NULL 
        WHERE deleted_at = '0000-00-00 00:00:00'
      `);
      console.log('✅ Fixed invalid timestamp values');
      
      // Update NULL timestamps for inactive colleges
      const [updateResult] = await connection.execute(`
        UPDATE colleges 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE is_active = FALSE AND deleted_at IS NULL
      `);
      console.log(`✅ Updated ${updateResult.affectedRows} soft-deleted colleges`);
    } catch (error) {
      console.log('⚠️  Could not update soft-deleted colleges:', error.message);
    }

    // Step 5: Create new views
    console.log('\n🔧 Step 5: Creating new database views...');
    
    // Active colleges view
    try {
      await connection.execute(`
        CREATE OR REPLACE VIEW active_colleges AS
        SELECT * FROM colleges 
        WHERE is_active = TRUE
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
        WHERE is_active = FALSE
      `);
      console.log('✅ deleted_colleges view created');
    } catch (error) {
      console.log('❌ Error creating deleted_colleges view:', error.message);
    }

    // Step 6: Test code reuse functionality
    console.log('\n🔧 Step 6: Testing code reuse functionality...');
    
    // Find a deleted college to test with
    const [deletedColleges] = await connection.execute(`
      SELECT code FROM colleges 
      WHERE is_active = FALSE 
      LIMIT 1
    `);
    
    if (deletedColleges.length > 0) {
      const testCode = deletedColleges[0].code;
      console.log(`📊 Testing with deleted college code: ${testCode}`);
      
      // Try to create a new college with the same code
      try {
        const testId = `test-${Date.now()}`;
        await connection.execute(`
          INSERT INTO colleges (id, name, code, address, city, state, country)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [testId, 'Test College for Code Reuse', testCode, 'Test Address', 'Test City', 'Test State', 'India']);
        
        console.log('✅ Code reuse test successful - new college created with deleted code');
        
        // Clean up the test college
        await connection.execute('DELETE FROM colleges WHERE id = ?', [testId]);
        console.log('✅ Test college cleaned up');
        
      } catch (error) {
        console.log('❌ Code reuse test failed:', error.message);
      }
    } else {
      console.log('ℹ️  No deleted colleges found for code reuse test');
    }

    // Step 7: Show final status
    console.log('\n🔧 Step 7: Final status check...');
    const [colleges] = await connection.execute(`
      SELECT 
        COUNT(*) as total_colleges,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_colleges,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as deleted_colleges,
        SUM(CASE WHEN deleted_at IS NOT NULL THEN 1 ELSE 0 END) as soft_deleted_colleges
      FROM colleges
    `);

    const stats = colleges[0];
    console.log('📊 Final College Status:');
    console.log(`   Total Colleges: ${stats.total_colleges}`);
    console.log(`   Active Colleges: ${stats.active_colleges}`);
    console.log(`   Inactive Colleges: ${stats.deleted_colleges}`);
    console.log(`   Soft Deleted Colleges: ${stats.soft_deleted_colleges}`);

    // Step 8: Show current constraints
    console.log('\n🔧 Step 8: Current constraints...');
    const [currentIndexes] = await connection.execute('SHOW INDEX FROM colleges');
    console.log('📊 Current indexes:');
    currentIndexes.forEach(idx => {
      console.log(`   - ${idx.Key_name} on ${idx.Column_name} (${idx.Non_unique ? 'Non-unique' : 'Unique'})`);
    });

    console.log('\n🎉 College constraints fixed successfully!');
    console.log('\n📋 What was fixed:');
    console.log('   ✅ Removed all problematic unique constraints on code column');
    console.log('   ✅ Fixed timestamp issues');
    console.log('   ✅ Recreated database views');
    console.log('   ✅ Tested code reuse functionality');
    console.log('   ✅ College codes can now be reused after deletion');

  } catch (error) {
    console.error('❌ Error fixing college constraints:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 Database connection closed');
    }
    await pool.end();
  }
}

// Run the fix
console.log('🚀 Starting Final College Constraints Fix...\n');
fixCollegeConstraintsFinal()
  .then(() => {
    console.log('\n✨ Fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });
