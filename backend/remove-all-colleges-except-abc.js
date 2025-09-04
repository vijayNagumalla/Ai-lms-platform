// Script to remove all colleges except ABC College from the database
import { pool } from './config/database.js';

async function removeAllCollegesExceptABC() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await pool.getConnection();
    console.log('✅ Database connected successfully\n');

    // Step 1: Check current colleges
    console.log('🔍 Step 1: Checking current colleges in database...');
    const [allColleges] = await connection.execute(`
      SELECT id, name, code, is_active 
      FROM colleges 
      ORDER BY name
    `);
    
    console.log(`📊 Found ${allColleges.length} colleges in database:`);
    allColleges.forEach((college, index) => {
      console.log(`   ${index + 1}. ${college.name} (${college.code}) - Active: ${college.is_active ? 'Yes' : 'No'}`);
    });

    // Step 2: Find ABC College
    console.log('\n🔍 Step 2: Looking for ABC College...');
    const [abcCollege] = await connection.execute(`
      SELECT id, name, code, is_active 
      FROM colleges 
      WHERE name LIKE '%ABC%' OR code LIKE '%ABC%'
    `);
    
    if (abcCollege.length === 0) {
      console.log('⚠️  ABC College not found in database');
      console.log('❌ Cannot proceed without ABC College to preserve');
      return;
    }
    
    const abcCollegeInfo = abcCollege[0];
    console.log(`✅ Found ABC College: ${abcCollegeInfo.name} (${abcCollegeInfo.code})`);
    
    // Step 3: Check dependencies for colleges to be deleted
    console.log('\n🔍 Step 3: Checking dependencies for colleges to be deleted...');
    const collegesToDelete = allColleges.filter(college => college.id !== abcCollegeInfo.id);
    
    if (collegesToDelete.length === 0) {
      console.log('ℹ️  No colleges to delete - only ABC College exists');
      return;
    }
    
    console.log(`📊 Will delete ${collegesToDelete.length} colleges:`);
    collegesToDelete.forEach((college, index) => {
      console.log(`   ${index + 1}. ${college.name} (${college.code})`);
    });
    
    // Step 4: Check for active users and departments
    console.log('\n🔍 Step 4: Checking for active users and departments...');
    for (const college of collegesToDelete) {
      const [activeUsers] = await connection.execute(
        'SELECT COUNT(*) as count FROM users WHERE college_id = ? AND is_active = TRUE',
        [college.id]
      );
      
      const [activeDepartments] = await connection.execute(
        'SELECT COUNT(*) as count FROM departments WHERE college_id = ? AND is_active = TRUE',
        [college.id]
      );
      
      if (activeUsers[0].count > 0 || activeDepartments[0].count > 0) {
        console.log(`⚠️  ${college.name} has active dependencies:`);
        console.log(`   - Active users: ${activeUsers[0].count}`);
        console.log(`   - Active departments: ${activeDepartments[0].count}`);
        console.log(`   - Cannot safely delete this college`);
        return;
      }
    }
    
    console.log('✅ All colleges to be deleted have no active dependencies');
    
    // Step 5: Confirm deletion
    console.log('\n⚠️  WARNING: This will permanently delete the following colleges:');
    collegesToDelete.forEach((college, index) => {
      console.log(`   ${index + 1}. ${college.name} (${college.code})`);
    });
    console.log(`\n✅ ABC College will be preserved: ${abcCollegeInfo.name} (${abcCollegeInfo.code})`);
    
    // Step 6: Perform deletion
    console.log('\n🗑️  Step 5: Starting deletion process...');
    await connection.beginTransaction();
    
    try {
      let deletedCount = 0;
      
      for (const college of collegesToDelete) {
        console.log(`\n🗑️  Deleting ${college.name} (${college.code})...`);
        
        // Delete related data first
        await connection.execute(
          'DELETE FROM users WHERE college_id = ?',
          [college.id]
        );
        
        await connection.execute(
          'DELETE FROM departments WHERE college_id = ?',
          [college.id]
        );
        
        await connection.execute(
          'DELETE FROM college_departments WHERE college_id = ?',
          [college.id]
        );
        
        // Delete the college
        await connection.execute(
          'DELETE FROM colleges WHERE id = ?',
          [college.id]
        );
        
        console.log(`✅ ${college.name} deleted successfully`);
        deletedCount++;
      }
      
      await connection.commit();
      console.log(`\n🎉 Successfully deleted ${deletedCount} colleges!`);
      
    } catch (transactionError) {
      await connection.rollback();
      throw transactionError;
    }
    
    // Step 7: Verify final state
    console.log('\n🔍 Step 6: Verifying final state...');
    const [finalColleges] = await connection.execute(`
      SELECT id, name, code, is_active 
      FROM colleges 
      ORDER BY name
    `);
    
    console.log(`📊 Final college count: ${finalColleges.length}`);
    finalColleges.forEach((college, index) => {
      console.log(`   ${index + 1}. ${college.name} (${college.code}) - Active: ${college.is_active ? 'Yes' : 'No'}`);
    });
    
    // Step 8: Check database views
    console.log('\n🔍 Step 7: Checking database views...');
    try {
      const [activeColleges] = await connection.execute('SELECT COUNT(*) as count FROM active_colleges');
      const [deletedColleges] = await connection.execute('SELECT COUNT(*) as count FROM deleted_colleges');
      
      console.log(`✅ active_colleges view: ${activeColleges[0].count} colleges`);
      console.log(`✅ deleted_colleges view: ${deletedColleges[0].count} colleges`);
    } catch (error) {
      console.log('⚠️  Could not check database views:', error.message);
    }
    
    console.log('\n🎉 Operation completed successfully!');
    console.log('📋 Summary:');
    console.log(`   ✅ ABC College preserved: ${abcCollegeInfo.name}`);
    console.log(`   ✅ Deleted ${collegesToDelete.length} other colleges`);
    console.log(`   ✅ Final college count: ${finalColleges.length}`);
    
  } catch (error) {
    console.error('❌ Error removing colleges:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    if (connection) {
      connection.release();
      console.log('\n🔌 Database connection closed');
    }
    await pool.end();
  }
}

// Run the script
console.log('🚀 Starting College Cleanup - Remove All Except ABC College...\n');
removeAllCollegesExceptABC()
  .then(() => {
    console.log('\n✨ Cleanup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Cleanup failed:', error);
    process.exit(1);
  });
