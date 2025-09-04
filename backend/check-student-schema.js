// Script to check student database schema and identify issues
import { pool } from './config/database.js';

async function checkStudentSchema() {
  try {
    console.log('🔍 Checking Student Database Schema...\n');
    
    // Check if users table exists and get its structure
    const [tableInfo] = await pool.execute(`
      SELECT TABLE_NAME, COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = 'lms_platform' 
      AND TABLE_NAME = 'users'
      ORDER BY ORDINAL_POSITION
    `);
    
    console.log('📊 Users Table Structure:');
    tableInfo.forEach(column => {
      console.log(`   ${column.COLUMN_NAME}: ${column.DATA_TYPE} ${column.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL'} ${column.COLUMN_DEFAULT ? `DEFAULT ${column.COLUMN_DEFAULT}` : ''}`);
    });
    
    // Check for required student fields
    const requiredFields = [
      'joining_year', 'final_year', 'current_year', 'year_start_date', 'admission_type'
    ];
    
    console.log('\n🔍 Checking Required Student Fields:');
    const existingFields = tableInfo.map(col => col.COLUMN_NAME);
    
    requiredFields.forEach(field => {
      if (existingFields.includes(field)) {
        console.log(`   ✅ ${field}: Found`);
      } else {
        console.log(`   ❌ ${field}: MISSING`);
      }
    });
    
    // Check if there are any students in the database
    const [studentCount] = await pool.execute(`
      SELECT COUNT(*) as count FROM users WHERE role = 'student'
    `);
    
    console.log(`\n📊 Current Student Count: ${studentCount[0].count}`);
    
    // Check sample student data if any exists
    if (studentCount[0].count > 0) {
      const [sampleStudents] = await pool.execute(`
        SELECT id, name, student_id, joining_year, final_year, current_year, year_start_date, admission_type
        FROM users 
        WHERE role = 'student' 
        LIMIT 3
      `);
      
      console.log('\n📊 Sample Student Data:');
      sampleStudents.forEach((student, index) => {
        console.log(`   Student ${index + 1}:`);
        console.log(`     ID: ${student.id}`);
        console.log(`     Name: ${student.name}`);
        console.log(`     Student ID: ${student.student_id}`);
        console.log(`     Joining Year: ${student.joining_year || 'NULL'}`);
        console.log(`     Final Year: ${student.final_year || 'NULL'}`);
        console.log(`     Current Year: ${student.current_year || 'NULL'}`);
        console.log(`     Year Start Date: ${student.year_start_date || 'NULL'}`);
        console.log(`     Admission Type: ${student.admission_type || 'NULL'}`);
        console.log('');
      });
    }
    
    // Check for any constraints or indexes
    const [indexes] = await pool.execute(`
      SHOW INDEX FROM users
    `);
    
    console.log('📊 Database Indexes:');
    indexes.forEach(index => {
      console.log(`   ${index.Key_name}: ${index.Column_name} (${index.Non_unique ? 'Non-unique' : 'Unique'})`);
    });
    
    // Check if stored procedures exist
    try {
      const [procedures] = await pool.execute(`
        SELECT ROUTINE_NAME 
        FROM INFORMATION_SCHEMA.ROUTINES 
        WHERE ROUTINE_SCHEMA = 'lms_platform' 
        AND ROUTINE_TYPE = 'PROCEDURE'
      `);
      
      console.log('\n📊 Stored Procedures:');
      if (procedures.length > 0) {
        procedures.forEach(proc => {
          console.log(`   ✅ ${proc.ROUTINE_NAME}`);
        });
      } else {
        console.log('   ℹ️  No stored procedures found');
      }
    } catch (error) {
      console.log('   ⚠️  Could not check stored procedures:', error.message);
    }
    
    // Summary
    console.log('\n🔍 Summary:');
    const missingFields = requiredFields.filter(field => !existingFields.includes(field));
    
    if (missingFields.length === 0) {
      console.log('   ✅ All required student fields are present');
    } else {
      console.log(`   ❌ Missing fields: ${missingFields.join(', ')}`);
      console.log('   💡 You need to run the database migrations to add these fields');
    }
    
  } catch (error) {
    console.error('❌ Error checking schema:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

console.log('🚀 Starting Student Schema Check...\n');
checkStudentSchema();
