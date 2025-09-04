// Test script to test the API endpoint for student creation
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

async function testAPIStudentCreation() {
  try {
    console.log('🧪 Testing API Student Creation...\n');
    
    // Test data for new student
    const testStudent = {
      name: 'API Test Student Final Year',
      email: 'apitestfinalyear@test.com',
      role: 'student',
      college_id: 'd16642d5-c0ea-4d08-abf7-39fca6551ee5', // ABC College ID
      department: 'Computer Science',
      batch: '2024',
      student_id: 'API_TEST_001',
      phone: '1234567890',
      is_active: true,
      joining_year: 2024,
      final_year: 2028
    };
    
    console.log('📊 Test Student Data:');
    console.log(JSON.stringify(testStudent, null, 2));
    
    // Test the API endpoint
    console.log('\n🔍 Testing API Endpoint...');
    const response = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: You'll need to add proper authentication headers here
        // 'Authorization': 'Bearer YOUR_TOKEN'
      },
      body: JSON.stringify(testStudent)
    });
    
    console.log(`📊 Response Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ API Response:');
      console.log(JSON.stringify(data, null, 2));
      
      // Check if final year is correct
      if (data.data && data.data.final_year === testStudent.final_year) {
        console.log('\n✅ SUCCESS: Final Year field is working correctly via API!');
        console.log(`   Expected: ${testStudent.final_year}`);
        console.log(`   Actual: ${data.data.final_year}`);
      } else {
        console.log('\n❌ FAILURE: Final Year field is NOT working correctly via API!');
        console.log(`   Expected: ${testStudent.final_year}`);
        console.log(`   Actual: ${data.data?.final_year || 'undefined'}`);
      }
    } else {
      const errorData = await response.text();
      console.log('❌ API Error Response:');
      console.log(errorData);
      
      if (response.status === 401) {
        console.log('\n⚠️  Authentication required. Please add proper authorization headers.');
      }
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
  }
}

console.log('🚀 Starting API Student Creation Test...\n');
console.log('⚠️  Note: This test requires the backend server to be running on port 5000');
console.log('⚠️  Note: You may need to add proper authentication headers\n');

testAPIStudentCreation();
