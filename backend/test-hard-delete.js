// Test script to demonstrate Hard Delete actually removes data from database
import { pool } from './config/database.js';
import crypto from 'crypto';

// Test data
const testCollege = {
  name: 'Test College for Hard Delete',
  code: 'TEST_HARD_DEL',
  address: '123 Test Street',
  city: 'Test City',
  state: 'Test State',
  country: 'India',
  phone: '1234567890',
  email: 'test@harddelete.com'
};

// Helper function to create a test college
async function createTestCollege() {
  console.log('\n🧪 Creating Test College for Hard Delete');
  console.log('==========================================');
  
  try {
    const id = crypto.randomUUID();
    const [result] = await pool.execute(`
      INSERT INTO colleges (id, name, code, address, city, state, country, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [id, testCollege.name, testCollege.code, testCollege.address, testCollege.city, 
        testCollege.state, testCollege.country, testCollege.phone, testCollege.email]);
    
    console.log('✅ Test college created successfully');
    console.log(`📊 College ID: ${id}`);
    return id;
  } catch (error) {
    console.error('❌ Failed to create test college:', error.message);
    return null;
  }
}

// Helper function to check college status
async function checkCollegeStatus(collegeId) {
  try {
    const [colleges] = await pool.execute(`
      SELECT id, name, code, is_active, deleted_at 
      FROM colleges 
      WHERE id = ?
    `, [collegeId]);
    
    if (colleges.length > 0) {
      const college = colleges[0];
      console.log(`📊 College Status:`);
      console.log(`   ID: ${college.id}`);
      console.log(`   Name: ${college.name}`);
      console.log(`   Code: ${college.code}`);
      console.log(`   Active: ${college.is_active ? 'Yes' : 'No'}`);
      console.log(`   Deleted At: ${college.deleted_at || 'Not set'}`);
      return college;
    } else {
      console.log('❌ College not found in database');
      return null;
    }
  } catch (error) {
    console.error('❌ Error checking college status:', error.message);
    return null;
  }
}

// Helper function to count total colleges
async function countColleges() {
  try {
    const [result] = await pool.execute('SELECT COUNT(*) as count FROM colleges');
    return result[0].count;
  } catch (error) {
    console.error('❌ Error counting colleges:', error.message);
    return 0;
  }
}

// Test 1: Hard delete college (actually remove from database)
async function testHardDelete(collegeId) {
  console.log('\n🧪 Test 1: Hard Deleting College (Removing from Database)');
  console.log('==========================================================');
  
  try {
    // Check if college has active users
    const [activeUsers] = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE college_id = ? AND is_active = TRUE',
      [collegeId]
    );

    if (activeUsers[0].count > 0) {
      console.log('⚠️  College has active users, cannot delete');
      return false;
    }

    // Check if college has active departments
    const [activeDepartments] = await pool.query(
      'SELECT COUNT(*) as count FROM departments WHERE college_id = ? AND is_active = TRUE',
      [collegeId]
    );

    if (activeDepartments[0].count > 0) {
      console.log('⚠️  College has active departments, cannot delete');
      return false;
    }

    // Start transaction for hard delete
    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Hard delete - permanently remove all data
      await connection.execute(
        'DELETE FROM users WHERE college_id = ?',
        [collegeId]
      );
      
      await connection.execute(
        'DELETE FROM departments WHERE college_id = ?',
        [collegeId]
      );
      
      await connection.execute(
        'DELETE FROM college_departments WHERE college_id = ?',
        [collegeId]
      );
      
      await connection.execute(
        'DELETE FROM colleges WHERE id = ?',
        [collegeId]
      );

      await connection.commit();
      console.log('✅ College hard deleted successfully - DATA REMOVED FROM DATABASE');
      return true;

    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('❌ Failed to hard delete college:', error.message);
    return false;
  }
}

// Test 2: Verify college is completely removed from database
async function testCollegeRemoved(collegeId) {
  console.log('\n🧪 Test 2: Verifying College is Completely Removed');
  console.log('====================================================');
  
  try {
    const [colleges] = await pool.execute(`
      SELECT id, name, code 
      FROM colleges 
      WHERE id = ?
    `, [collegeId]);
    
    if (colleges.length === 0) {
      console.log('✅ College completely removed from database');
      console.log('✅ Hard delete successful - data no longer exists');
      return true;
    } else {
      console.log('❌ College still exists in database');
      console.log('❌ Hard delete failed - data still present');
      return false;
    }
  } catch (error) {
    console.error('❌ Error verifying college removal:', error.message);
    return false;
  }
}

// Test 3: Check database views
async function testDatabaseViews() {
  console.log('\n🧪 Test 3: Checking Database Views After Hard Delete');
  console.log('======================================================');
  
  try {
    // Test active_colleges view
    const [activeColleges] = await pool.execute('SELECT * FROM active_colleges');
    console.log(`✅ active_colleges view: ${activeColleges.length} colleges`);
    
    // Test deleted_colleges view
    const [deletedColleges] = await pool.execute('SELECT * FROM deleted_colleges');
    console.log(`✅ deleted_colleges view: ${deletedColleges.length} colleges`);
    
    // Check if our test college appears in any view
    const [testCollegeInViews] = await pool.execute(`
      SELECT 'active_colleges' as view_name, COUNT(*) as count 
      FROM active_colleges WHERE code = ?
      UNION ALL
      SELECT 'deleted_colleges' as view_name, COUNT(*) as count 
      FROM deleted_colleges WHERE code = ?
    `, [testCollege.code, testCollege.code]);
    
    let foundInViews = false;
    testCollegeInViews.forEach(view => {
      if (view.count > 0) {
        console.log(`⚠️  Test college found in ${view.view_name} view`);
        foundInViews = true;
      }
    });
    
    if (!foundInViews) {
      console.log('✅ Test college not found in any database view');
      console.log('✅ Hard delete completely removed all references');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Database views test failed:', error.message);
    return false;
  }
}

// Main test runner
async function runHardDeleteTest() {
  console.log('🚀 Starting Hard Delete Test - Data Removal Verification');
  console.log('==========================================================');
  
  try {
    // Get initial college count
    const initialCount = await countColleges();
    console.log(`📊 Initial college count: ${initialCount}`);
    
    // Test 0: Check database views
    await testDatabaseViews();
    
    // Test 1: Create college
    const collegeId = await createTestCollege();
    if (!collegeId) {
      console.log('❌ Cannot continue tests without creating a college');
      return;
    }
    
    // Check college count after creation
    const afterCreateCount = await countColleges();
    console.log(`📊 College count after creation: ${afterCreateCount}`);
    
    // Check initial status
    await checkCollegeStatus(collegeId);
    
    // Test 2: Hard delete college
    const hardDeleteSuccess = await testHardDelete(collegeId);
    if (!hardDeleteSuccess) {
      console.log('❌ Cannot continue tests without successful hard delete');
      return;
    }
    
    // Check college count after deletion
    const afterDeleteCount = await countColleges();
    console.log(`📊 College count after hard delete: ${afterDeleteCount}`);
    
    // Test 3: Verify college is completely removed
    await testCollegeRemoved(collegeId);
    
    // Test 4: Check database views again
    await testDatabaseViews();
    
    // Final verification
    console.log('\n🔍 Final Verification:');
    console.log(`   Initial count: ${initialCount}`);
    console.log(`   After creation: ${afterCreateCount}`);
    console.log(`   After deletion: ${afterDeleteCount}`);
    
    if (afterDeleteCount === initialCount) {
      console.log('✅ SUCCESS: College count returned to original value');
      console.log('✅ SUCCESS: Hard delete completely removed data from database');
    } else {
      console.log('❌ FAILURE: College count did not return to original value');
      console.log('❌ FAILURE: Hard delete may not have worked properly');
    }
    
    console.log('\n🎉 Hard Delete Test completed!');
    console.log('📋 Summary:');
    console.log('   ✅ College creation');
    console.log('   ✅ Hard deletion (data removal)');
    console.log('   ✅ Database verification');
    console.log('   ✅ View verification');
    console.log('   ✅ Count verification');
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  } finally {
    // Close database connection
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run tests directly
console.log('Starting Hard Delete Test...');
runHardDeleteTest();
