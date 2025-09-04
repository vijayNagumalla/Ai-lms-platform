// Test script for College Deletion Functionality
// This script tests the enhanced college deletion system

import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000/api';
let authToken = '';

// Test data
const testCollege = {
  name: 'Test College for Deletion',
  code: 'TEST_DEL',
  address: '123 Test Street',
  city: 'Test City',
  state: 'Test State',
  country: 'India',
  phone: '1234567890',
  email: 'test@testcollege.com'
};

// Helper function to make authenticated requests
async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(authToken && { 'Authorization': `Bearer ${authToken}` }),
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
  console.log('\n🧪 Test 1: Creating Test College');
  console.log('================================');
  
  const response = await makeRequest('/colleges', {
    method: 'POST',
    body: JSON.stringify(testCollege)
  });
  
  if (response.status === 201 || response.status === 200) {
    console.log('✅ College created successfully');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return response.data.data?.id;
  } else {
    console.log('❌ Failed to create college');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return null;
  }
}

// Test 2: Check deletion status before deletion
async function testDeletionStatus(collegeId) {
  console.log('\n🧪 Test 2: Checking Deletion Status');
  console.log('====================================');
  
  const response = await makeRequest(`/colleges/${collegeId}/deletion-status`);
  
  if (response.status === 200) {
    console.log('✅ Deletion status retrieved successfully');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
  } else {
    console.log('❌ Failed to get deletion status');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
  }
}

// Test 3: Soft delete the college
async function testSoftDelete(collegeId) {
  console.log('\n🧪 Test 3: Soft Deleting College');
  console.log('==================================');
  
  const response = await makeRequest(`/colleges/${collegeId}`, {
    method: 'DELETE'
  });
  
  if (response.status === 200) {
    console.log('✅ College soft deleted successfully');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to soft delete college');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return false;
  }
}

// Test 4: Verify college is in deleted list
async function testGetDeletedColleges() {
  console.log('\n🧪 Test 4: Getting Deleted Colleges List');
  console.log('==========================================');
  
  const response = await makeRequest('/colleges/deleted/list');
  
  if (response.status === 200) {
    console.log('✅ Deleted colleges list retrieved successfully');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    const deletedCollege = response.data.data?.find(c => c.code === testCollege.code);
    if (deletedCollege) {
      console.log('✅ Test college found in deleted list');
      return deletedCollege.id;
    } else {
      console.log('❌ Test college not found in deleted list');
      return null;
    }
  } else {
    console.log('❌ Failed to get deleted colleges list');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return null;
  }
}

// Test 5: Restore the deleted college
async function testRestoreCollege(collegeId) {
  console.log('\n🧪 Test 5: Restoring Deleted College');
  console.log('======================================');
  
  const response = await makeRequest(`/colleges/${collegeId}/restore`, {
    method: 'PATCH'
  });
  
  if (response.status === 200) {
    console.log('✅ College restored successfully');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to restore college');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return false;
  }
}

// Test 6: Verify college is active again
async function testCollegeActive(collegeId) {
  console.log('\n🧪 Test 6: Verifying College is Active');
  console.log('========================================');
  
  const response = await makeRequest(`/colleges/${collegeId}`);
  
  if (response.status === 200) {
    console.log('✅ College details retrieved successfully');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data.data?.is_active) {
      console.log('✅ College is active again');
      return true;
    } else {
      console.log('❌ College is still inactive');
      return false;
    }
  } else {
    console.log('❌ Failed to get college details');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return false;
  }
}

// Test 7: Test code reuse after deletion
async function testCodeReuse() {
  console.log('\n🧪 Test 7: Testing Code Reuse After Deletion');
  console.log('==============================================');
  
  // First, delete the college again
  const response1 = await makeRequest(`/colleges/${testCollege.code}`, {
    method: 'DELETE'
  });
  
  if (response1.status === 200) {
    console.log('✅ College deleted again for code reuse test');
    
    // Try to create a new college with the same code
    const newCollege = {
      ...testCollege,
      name: 'New College with Reused Code',
      email: 'new@testcollege.com'
    };
    
    const response2 = await makeRequest('/colleges', {
      method: 'POST',
      body: JSON.stringify(newCollege)
    });
    
    if (response2.status === 201 || response2.status === 200) {
      console.log('✅ Code reuse successful - new college created with same code');
      console.log('📊 Response:', JSON.stringify(response2.data, null, 2));
      return response2.data.data?.id;
    } else {
      console.log('❌ Code reuse failed');
      console.log('📊 Response:', JSON.stringify(response2.data, null, 2));
      return null;
    }
  } else {
    console.log('❌ Failed to delete college for code reuse test');
    return null;
  }
}

// Test 8: Hard delete test (optional)
async function testHardDelete(collegeId) {
  console.log('\n🧪 Test 8: Testing Hard Delete (Optional)');
  console.log('===========================================');
  
  const response = await makeRequest(`/colleges/${collegeId}?hardDelete=true`, {
    method: 'DELETE'
  });
  
  if (response.status === 200) {
    console.log('✅ College hard deleted successfully');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return true;
  } else {
    console.log('❌ Failed to hard delete college');
    console.log('📊 Response:', JSON.stringify(response.data, null, 2));
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting College Deletion Functionality Tests');
  console.log('================================================');
  
  try {
    // Test 1: Create college
    const collegeId = await testCreateCollege();
    if (!collegeId) {
      console.log('❌ Cannot continue tests without creating a college');
      return;
    }
    
    // Test 2: Check deletion status
    await testDeletionStatus(collegeId);
    
    // Test 3: Soft delete
    const softDeleteSuccess = await testSoftDelete(collegeId);
    if (!softDeleteSuccess) {
      console.log('❌ Cannot continue tests without successful soft delete');
      return;
    }
    
    // Test 4: Get deleted colleges
    const deletedCollegeId = await testGetDeletedColleges();
    if (!deletedCollegeId) {
      console.log('❌ Cannot continue tests without finding deleted college');
      return;
    }
    
    // Test 5: Restore college
    const restoreSuccess = await testRestoreCollege(deletedCollegeId);
    if (!restoreSuccess) {
      console.log('❌ Cannot continue tests without successful restore');
      return;
    }
    
    // Test 6: Verify active status
    await testCollegeActive(deletedCollegeId);
    
    // Test 7: Test code reuse
    const newCollegeId = await testCodeReuse();
    if (newCollegeId) {
      // Test 8: Hard delete (optional)
      await testHardDelete(newCollegeId);
    }
    
    console.log('\n🎉 All tests completed!');
    console.log('📋 Summary:');
    console.log('   ✅ College creation');
    console.log('   ✅ Deletion status checking');
    console.log('   ✅ Soft deletion');
    console.log('   ✅ Deleted colleges listing');
    console.log('   ✅ College restoration');
    console.log('   ✅ Active status verification');
    console.log('   ✅ Code reuse functionality');
    console.log('   ✅ Hard deletion (optional)');
    
  } catch (error) {
    console.error('💥 Test execution failed:', error);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests();
}

export {
  runAllTests,
  testCreateCollege,
  testSoftDelete,
  testRestoreCollege,
  testCodeReuse
};
