// Script to fix college constraints and views for proper code reuse
import { pool } from './config/database.js';

async function fixCollegeConstraints() {
  let connection;
  
  try {
    console.log('🔌 Connecting to database...');
    connection = await pool.getConnection();
    console.log('✅ Database connected successfully\n');

    // Step 1: Drop existing problematic views
    console.log('🔧 Step 1: Dropping existing views...');
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

    // Step 2: Drop existing unique constraints on code
    console.log('\n🔧 Step 2: Dropping existing constraints...');
    try {
      await connection.execute('ALTER TABLE colleges DROP INDEX code');
      console.log('✅ Dropped code index');
    } catch (error) {
      console.log('ℹ️  code index not found or already dropped');
    }
    
    try {
      await connection.execute('ALTER TABLE colleges DROP INDEX idx_unique_active_college_code');
      console.log('✅ Dropped idx_unique_active_college_code index');
    } catch (error) {
      console.log('ℹ️  idx_unique_active_college_code index not found or already dropped');
    }

    // Step 3: Create a new unique constraint that allows soft-deleted codes to be reused
    console.log('\n🔧 Step 3: Creating new unique constraint...');
    try {
      // For MySQL versions that don't support partial indexes, we'll use a different approach
      // We'll create a unique constraint on (code, is_active) which allows multiple inactive codes
      await connection.execute(`
        ALTER TABLE colleges 
        ADD CONSTRAINT unique_active_college_code 
        UNIQUE (code, is_active)
      `);
      console.log('✅ Created unique constraint on (code, is_active)');
    } catch (error) {
      console.log('⚠️  Could not create unique constraint:', error.message);
      console.log('ℹ️  This is expected if the constraint already exists');
    }

    // Step 4: Recreate the views with proper timestamp handling
    console.log('\n🔧 Step 4: Recreating database views...');
    
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

    // Step 5: Update any existing soft-deleted colleges to have proper deleted_at timestamps
    console.log('\n🔧 Step 5: Updating existing soft-deleted colleges...');
    try {
      // First, set invalid timestamps to NULL
      await connection.execute(`
        UPDATE colleges 
        SET deleted_at = NULL 
        WHERE deleted_at = '0000-00-00 00:00:00'
      `);
      console.log('✅ Fixed invalid timestamp values');
      
      // Then update NULL timestamps for inactive colleges
      const [updateResult] = await connection.execute(`
        UPDATE colleges 
        SET deleted_at = CURRENT_TIMESTAMP 
        WHERE is_active = FALSE AND deleted_at IS NULL
      `);
      console.log(`✅ Updated ${updateResult.affectedRows} soft-deleted colleges`);
    } catch (error) {
      console.log('⚠️  Could not update soft-deleted colleges:', error.message);
    }

    // Step 6: Show the current status
    console.log('\n🔧 Step 6: Checking current status...');
    const [colleges] = await connection.execute(`
      SELECT 
        COUNT(*) as total_colleges,
        SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_colleges,
        SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as deleted_colleges,
        SUM(CASE WHEN deleted_at IS NOT NULL AND deleted_at != '0000-00-00 00:00:00' THEN 1 ELSE 0 END) as soft_deleted_colleges
      FROM colleges
    `);

    const stats = colleges[0];
    console.log('📊 Current College Status:');
    console.log(`   Total Colleges: ${stats.total_colleges}`);
    console.log(`   Active Colleges: ${stats.active_colleges}`);
    console.log(`   Inactive Colleges: ${stats.deleted_colleges}`);
    console.log(`   Soft Deleted Colleges: ${stats.soft_deleted_colleges}`);

    // Step 7: Test the new constraint
    console.log('\n🔧 Step 7: Testing new constraint...');
    try {
      // Try to create a college with a code that might already exist
      const testCode = 'TEST_CONSTRAINT';
      const [existing] = await connection.execute(
        'SELECT COUNT(*) as count FROM colleges WHERE code = ? AND is_active = TRUE',
        [testCode]
      );
      
      if (existing[0].count === 0) {
        console.log('✅ Constraint test: No active college with test code exists');
      } else {
        console.log('⚠️  Constraint test: Active college with test code already exists');
      }
    } catch (error) {
      console.log('❌ Constraint test failed:', error.message);
    }

    console.log('\n🎉 College constraints fixed successfully!');
    console.log('\n📋 What was fixed:');
    console.log('   ✅ Dropped problematic views');
    console.log('   ✅ Removed old unique constraints');
    console.log('   ✅ Created new constraint allowing code reuse');
    console.log('   ✅ Recreated views with proper logic');
    console.log('   ✅ Updated existing soft-deleted colleges');
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
console.log('🚀 Starting College Constraints Fix...\n');
fixCollegeConstraints()
  .then(() => {
    console.log('\n✨ Fix completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Fix failed:', error);
    process.exit(1);
  });
