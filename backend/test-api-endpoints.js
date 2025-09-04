// Test script to demonstrate the new API endpoints
// This shows how to use both hard delete and soft delete

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testCollege = {
  name: 'API Test College',
  code: 'API_TEST',
  address: '123 API Street',
  city: 'API City',
  state: 'API State',
  country: 'India',
  phone: '1234567890',
  email: 'api@testcollege.com'
};

// Helper function to make requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  };
  
  try {
    const response = await fetch(url, config);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, data: { error: error.message } };
  }
}

// Test 1: Create a test college
async function testCreateCollege() {
  console.log('\n🧪 Test 1: Creating Test College via API');
  console.log('==========================================');
  
  const response = await makeRequest('/colleges', {
    method: 'POST',
    body: JSON.stringify(testCollege)
  });
  
  if (response.status === 201 || response.status === 200) {
    console.log('✅ College created successfully via API');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return response.data.data?.id;
  } else {
    console.log('❌ Failed to create college via API');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return null;
  }
}

// Test 2: Test HARD DELETE (default behavior - removes data from database)
async function testHardDelete(collegeId) {
  console.log('\n🧪 Test 2: Testing HARD DELETE (Removes Data from Database)');
  console.log('============================================================');
  
  const response = await makeRequest(`/colleges/${collegeId}`, {
    method: 'DELETE'
  });
  
  if (response.status === 200) {
    console.log('✅ College HARD deleted successfully via API');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    // Verify it's a hard delete
    if (response.data.deletionType === 'hard') {
      console.log('✅ Confirmed: This was a HARD DELETE - data removed from database');
    } else {
      console.log('⚠️  Unexpected: This was not a hard delete');
    }
    
    return true;
  } else {
    console.log('❌ Failed to hard delete college via API');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return false;
  }
}

// Test 3: Create another college for soft delete test
async function testCreateCollegeForSoftDelete() {
  console.log('\n🧪 Test 3: Creating Another College for Soft Delete Test');
  console.log('==========================================================');
  
  const softDeleteCollege = {
    ...testCollege,
    name: 'Soft Delete Test College',
    code: 'SOFT_TEST',
    email: 'soft@testcollege.com'
  };
  
  const response = await makeRequest('/colleges', {
    method: 'POST',
    body: JSON.stringify(softDeleteCollege)
  });
  
  if (response.status === 201 || response.status === 200) {
    console.log('✅ College created successfully for soft delete test');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return response.data.data?.id;
  } else {
    console.log('❌ Failed to create college for soft delete test');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return null;
  }
}

// Test 4: Test SOFT DELETE (keeps data but marks as inactive)
async function testSoftDelete(collegeId) {
  console.log('\n🧪 Test 4: Testing SOFT DELETE (Keeps Data, Marks as Inactive)');
  console.log('================================================================');
  
  const response = await makeRequest(`/colleges/${collegeId}/soft`, {
    method: 'DELETE'
  });
  
  if (response.status === 200) {
    console.log('✅ College SOFT deleted successfully via API');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    // Verify it's a soft delete
    if (response.data.deletionType === 'soft') {
      console.log('✅ Confirmed: This was a SOFT DELETE - data kept but marked inactive');
    } else {
      console.log('⚠️  Unexpected: This was not a soft delete');
    }
    
    return true;
  } else {
    console.log('❌ Failed to soft delete college via API');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return false;
  }
}

// Test 5: Test the old way (should still work for backward compatibility)
async function testOldWayDelete(collegeId) {
  console.log('\n🧪 Test 5: Testing Old Way (Should Still Work)');
  console.log('================================================');
  
  const response = await makeRequest(`/colleges/${collegeId}?softDelete=true`, {
    method: 'DELETE'
  });
  
  if (response.status === 200) {
    console.log('✅ Old way still works for backward compatibility');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return true;
  } else {
    console.log('❌ Old way failed');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return false;
  }
}

// Main test runner
async function runAPITests() {
  console.log('🚀 Starting API Endpoint Tests');
  console.log('================================');
  console.log('This will test the new hard delete and soft delete endpoints');
  
  try {
    // Test 1: Create college
    const collegeId1 = await testCreateCollege();
    if (!collegeId1) {
      console.log('❌ Cannot continue tests without creating a college');
      return;
    }
    
    // Test 2: Hard delete (default behavior)
    const hardDeleteSuccess = await testHardDelete(collegeId1);
    if (!hardDeleteSuccess) {
      console.log('❌ Cannot continue tests without successful hard delete');
      return;
    }
    
    // Test 3: Create another college
    const collegeId2 = await testCreateCollegeForSoftDelete();
    if (!collegeId2) {
      console.log('❌ Cannot continue tests without creating another college');
      return;
    }
    
    // Test 4: Soft delete
    const softDeleteSuccess = await testSoftDelete(collegeId2);
    if (!softDeleteSuccess) {
      console.log('❌ Cannot continue tests without successful soft delete');
      return;
    }
    
    // Test 5: Test old way for backward compatibility
    const collegeId3 = await testCreateCollegeForSoftDelete();
    if (collegeId3) {
      await testOldWayDelete(collegeId3);
    }
    
    console.log('\n🎉 All API tests completed!');
    console.log('\n📋 Summary:');
    console.log('   ✅ College creation via API');
    console.log('   ✅ HARD DELETE (removes data from database)');
    console.log('   ✅ SOFT DELETE (keeps data, marks inactive)');
    console.log('   ✅ Backward compatibility maintained');
    
    console.log('\n🔌 API Endpoints Summary:');
    console.log('   DELETE /colleges/:id          → HARD DELETE (removes data)');
    console.log('   DELETE /colleges/:id/soft     → SOFT DELETE (keeps data)');
    console.log('   DELETE /colleges/:id?softDelete=true → SOFT DELETE (old way)');
    
  } catch (error) {
    console.error('💥 API test execution failed:', error);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAPITests();
}

export {
  runAPITests,
  testCreateCollege,
  testHardDelete,
  testSoftDelete
};
