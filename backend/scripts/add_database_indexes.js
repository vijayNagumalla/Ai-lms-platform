import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function addDatabaseIndexes() {
  let connection;
  
  try {
    // Create database connection
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'lms_platform',
      port: process.env.DB_PORT || 3306
    });

    console.log('🔗 Connected to database');

    // List of indexes to create
    const indexes = [
      {
        name: 'idx_student_coding_profiles_student_id',
        table: 'student_coding_profiles',
        columns: 'student_id',
        type: 'INDEX'
      },
      {
        name: 'idx_student_coding_profiles_platform_id',
        table: 'student_coding_profiles',
        columns: 'platform_id',
        type: 'INDEX'
      },
      {
        name: 'idx_student_coding_profiles_sync_status',
        table: 'student_coding_profiles',
        columns: 'sync_status',
        type: 'INDEX'
      },
      {
        name: 'idx_student_coding_profiles_last_synced',
        table: 'student_coding_profiles',
        columns: 'last_synced_at',
        type: 'INDEX'
      },
      {
        name: 'idx_student_coding_profiles_student_platform',
        table: 'student_coding_profiles',
        columns: 'student_id, platform_id',
        type: 'INDEX'
      },
      {
        name: 'idx_users_role_college',
        table: 'users',
        columns: 'role, college_id',
        type: 'INDEX'
      },
      {
        name: 'idx_users_name_email',
        table: 'users',
        columns: 'name, email',
        type: 'INDEX'
      },
      {
        name: 'idx_users_student_id',
        table: 'users',
        columns: 'student_id',
        type: 'INDEX'
      },
      {
        name: 'idx_coding_platform_data_profile_id',
        table: 'coding_platform_data',
        columns: 'profile_id',
        type: 'INDEX'
      },
      {
        name: 'idx_coding_platform_data_type',
        table: 'coding_platform_data',
        columns: 'data_type',
        type: 'INDEX'
      },
      {
        name: 'idx_coding_platform_data_recorded_at',
        table: 'coding_platform_data',
        columns: 'recorded_at',
        type: 'INDEX'
      },
      {
        name: 'idx_coding_achievements_profile_id',
        table: 'coding_achievements',
        columns: 'profile_id',
        type: 'INDEX'
      },
      {
        name: 'idx_coding_achievements_earned_at',
        table: 'coding_achievements',
        columns: 'earned_at',
        type: 'INDEX'
      }
    ];

    console.log('📊 Creating database indexes...');

    for (const index of indexes) {
      try {
        // Check if index already exists
        const [existingIndexes] = await connection.execute(`
          SELECT INDEX_NAME 
          FROM information_schema.STATISTICS 
          WHERE TABLE_SCHEMA = ? 
          AND TABLE_NAME = ? 
          AND INDEX_NAME = ?
        `, [process.env.DB_NAME || 'lms_platform', index.table, index.name]);

        if (existingIndexes.length > 0) {
          console.log(`✅ Index ${index.name} already exists on ${index.table}`);
          continue;
        }

        // Create the index
        const createIndexQuery = `
          CREATE ${index.type} ${index.name} 
          ON ${index.table} (${index.columns})
        `;

        await connection.execute(createIndexQuery);
        console.log(`✅ Created index ${index.name} on ${index.table} (${index.columns})`);

      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Index ${index.name} already exists on ${index.table}`);
        } else {
          console.error(`❌ Error creating index ${index.name}:`, error.message);
        }
      }
    }

    // Analyze tables for better query planning
    console.log('🔍 Analyzing tables for better query planning...');
    const tables = ['users', 'student_coding_profiles', 'coding_platforms', 'colleges', 'coding_platform_data', 'coding_achievements'];
    
    for (const table of tables) {
      try {
        await connection.execute(`ANALYZE TABLE ${table}`);
        console.log(`✅ Analyzed table ${table}`);
      } catch (error) {
        console.log(`⚠️  Could not analyze table ${table}:`, error.message);
      }
    }

    console.log('🎉 Database optimization completed successfully!');

  } catch (error) {
    console.error('❌ Error during database optimization:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the script
addDatabaseIndexes();
