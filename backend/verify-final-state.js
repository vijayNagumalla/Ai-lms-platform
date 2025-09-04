// Quick verification script to confirm final state
import { pool } from './config/database.js';

async function verifyFinalState() {
  try {
    console.log('🔍 Verifying final database state...\n');
    
    // Check colleges
    const [colleges] = await pool.execute(`
      SELECT id, name, code, is_active, created_at 
      FROM colleges 
      ORDER BY name
    `);
    
    console.log(`📊 Total colleges in database: ${colleges.length}`);
    console.log('\n🏫 Colleges:');
    colleges.forEach((college, index) => {
      console.log(`   ${index + 1}. ${college.name} (${college.code})`);
      console.log(`      ID: ${college.id}`);
      console.log(`      Active: ${college.is_active ? 'Yes' : 'No'}`);
      console.log(`      Created: ${college.created_at}`);
      console.log('');
    });
    
    // Check database views
    try {
      const [activeColleges] = await pool.execute('SELECT COUNT(*) as count FROM active_colleges');
      const [deletedColleges] = await pool.execute('SELECT COUNT(*) as count FROM deleted_colleges');
      
      console.log('📊 Database Views:');
      console.log(`   active_colleges: ${activeColleges[0].count} colleges`);
      console.log(`   deleted_colleges: ${deletedColleges[0].count} colleges`);
    } catch (error) {
      console.log('⚠️  Could not check database views:', error.message);
    }
    
    // Check if ABC College is the only one remaining
    if (colleges.length === 1 && colleges[0].name.includes('ABC')) {
      console.log('\n✅ SUCCESS: Only ABC College remains in the database!');
      console.log('✅ All other colleges have been successfully removed.');
    } else {
      console.log('\n⚠️  Unexpected state:');
      console.log(`   Expected: 1 college (ABC College)`);
      console.log(`   Found: ${colleges.length} colleges`);
    }
    
  } catch (error) {
    console.error('❌ Error verifying final state:', error.message);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

console.log('🚀 Verifying final database state...\n');
verifyFinalState();
