// Test script to test student creation functionality
import { pool } from './config/database.js';
import { v4 as uuidv4 } from 'uuid';

async function testStudentCreation() {
  try {
    console.log('🧪 Testing Student Creation Functionality...\n');
    
    // Test data for new student
    const testStudent = {
      name: 'Test Student Final Year',
      email: 'testfinalyear@test.com',
      role: 'student',
      college_id: null, // We'll set this to ABC College
      department: 'Computer Science',
      batch: '2024',
      student_id: 'TEST_FINAL_001',
      phone: '1234567890',
      is_active: true,
      joining_year: 2024,
      final_year: 2028
    };
    
    console.log('📊 Test Student Data:');
    console.log(JSON.stringify(testStudent, null, 2));
    
    // Step 1: Get ABC College ID
    console.log('\n🔍 Step 1: Getting ABC College ID...');
    const [colleges] = await pool.execute(`
      SELECT id, name, code FROM colleges WHERE name LIKE '%ABC%'
    `);
    
    if (colleges.length === 0) {
      console.log('❌ ABC College not found. Cannot proceed with test.');
      return;
    }
    
    const abcCollege = colleges[0];
    testStudent.college_id = abcCollege.id;
    console.log(`✅ Found ABC College: ${abcCollege.name} (${abcCollege.code}) - ID: ${abcCollege.id}`);
    
    // Step 2: Check if test email already exists
    console.log('\n🔍 Step 2: Checking if test email exists...');
    const [existingUser] = await pool.execute(`
      SELECT id FROM users WHERE email = ?
    `, [testStudent.email]);
    
    if (existingUser.length > 0) {
      console.log('⚠️  Test email already exists. Deleting existing user...');
      await pool.execute('DELETE FROM users WHERE email = ?', [testStudent.email]);
      console.log('✅ Existing test user deleted');
    }
    
    // Step 3: Check if test student ID already exists
    console.log('\n🔍 Step 3: Checking if test student ID exists...');
    const [existingStudent] = await pool.execute(`
      SELECT id FROM users WHERE UPPER(student_id) = ?
    `, [testStudent.student_id.toUpperCase()]);
    
    if (existingStudent.length > 0) {
      console.log('⚠️  Test student ID already exists. Deleting existing student...');
      await pool.execute('DELETE FROM users WHERE UPPER(student_id) = ?', [testStudent.student_id.toUpperCase()]);
      console.log('✅ Existing test student deleted');
    }
    
    // Step 4: Test the actual student creation logic
    console.log('\n🔍 Step 4: Testing Student Creation Logic...');
    
    // Simulate the logic from the controller
    const formattedName = testStudent.name.toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
    const formattedEmail = testStudent.email.toLowerCase().trim();
    const finalStudentId = testStudent.student_id.toUpperCase();
    
    let finalJoiningYear = null;
    let finalFinalYear = null;
    let finalCurrentYear = null;
    let yearStartDate = null;
    
    // Set joining year and final year
    if (testStudent.joining_year && testStudent.final_year) {
      finalJoiningYear = testStudent.joining_year;
      finalFinalYear = testStudent.final_year;
      finalCurrentYear = testStudent.joining_year; // Start with joining year
      yearStartDate = `${testStudent.joining_year}-06-01`;
    } else if (testStudent.joining_year) {
      // Only joining year specified, assume 4-year program
      finalJoiningYear = testStudent.joining_year;
      finalFinalYear = testStudent.joining_year + 4;
      finalCurrentYear = testStudent.joining_year;
      yearStartDate = `${testStudent.joining_year}-06-01`;
    } else {
      // Default to current year if not specified
      const currentYear = new Date().getFullYear();
      finalJoiningYear = currentYear;
      finalFinalYear = currentYear + 4;
      finalCurrentYear = currentYear;
      yearStartDate = `${currentYear}-06-01`;
    }
    
    console.log('📊 Calculated Year Values:');
    console.log(`   Joining Year: ${finalJoiningYear}`);
    console.log(`   Final Year: ${finalFinalYear}`);
    console.log(`   Current Year: ${finalCurrentYear}`);
    console.log(`   Year Start Date: ${yearStartDate}`);
    
    // Step 5: Insert the student into database
    console.log('\n🔍 Step 5: Inserting Student into Database...');
    const id = uuidv4();
    
    const insertResult = await pool.execute(`
      INSERT INTO users (id, email, password, name, role, college_id, department, batch, student_id, joining_year, final_year, current_year, year_start_date, phone, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, 
      formattedEmail, 
      finalStudentId, // password
      formattedName, 
      testStudent.role, 
      testStudent.college_id, 
      testStudent.department, 
      testStudent.batch, 
      finalStudentId, 
      finalJoiningYear, 
      finalFinalYear, 
      finalCurrentYear, 
      yearStartDate, 
      testStudent.phone, 
      testStudent.is_active
    ]);
    
    console.log('✅ Student inserted successfully!');
    console.log(`   Insert ID: ${id}`);
    console.log(`   Rows affected: ${insertResult[0].affectedRows}`);
    
    // Step 6: Verify the inserted data
    console.log('\n🔍 Step 6: Verifying Inserted Data...');
    const [insertedStudent] = await pool.execute(`
      SELECT id, name, email, student_id, joining_year, final_year, current_year, year_start_date, department, batch, college_id
      FROM users WHERE id = ?
    `, [id]);
    
    if (insertedStudent.length > 0) {
      const student = insertedStudent[0];
      console.log('📊 Inserted Student Data:');
      console.log(`   ID: ${student.id}`);
      console.log(`   Name: ${student.name}`);
      console.log(`   Email: ${student.email}`);
      console.log(`   Student ID: ${student.student_id}`);
      console.log(`   Joining Year: ${student.joining_year}`);
      console.log(`   Final Year: ${student.final_year}`);
      console.log(`   Current Year: ${student.current_year}`);
      console.log(`   Year Start Date: ${student.year_start_date}`);
      console.log(`   Department: ${student.department}`);
      console.log(`   Batch: ${student.batch}`);
      console.log(`   College ID: ${student.college_id}`);
      
      // Check if final year is correct
      if (student.final_year === testStudent.final_year) {
        console.log('\n✅ SUCCESS: Final Year field is working correctly!');
        console.log(`   Expected: ${testStudent.final_year}`);
        console.log(`   Actual: ${student.final_year}`);
      } else {
        console.log('\n❌ FAILURE: Final Year field is NOT working correctly!');
        console.log(`   Expected: ${testStudent.final_year}`);
        console.log(`   Actual: ${student.final_year}`);
      }
    } else {
      console.log('❌ Failed to retrieve inserted student data');
    }
    
    // Step 7: Clean up test data
    console.log('\n🔍 Step 7: Cleaning up test data...');
    await pool.execute('DELETE FROM users WHERE id = ?', [id]);
    console.log('✅ Test student deleted');
    
  } catch (error) {
    console.error('❌ Error testing student creation:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await pool.end();
    console.log('\n🔌 Database connection closed');
  }
}

console.log('🚀 Starting Student Creation Test...\n');
testStudentCreation();
