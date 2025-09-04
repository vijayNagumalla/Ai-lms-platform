// Test script for platform-specific data retrieval
// This script tests the new platform-specific implementations for CodeChef and HackerRank

import { fetchCodeChefData, fetchHackerRankData } from './backend/controllers/codingProfilesController.js';

// Test usernames (replace with real usernames for testing)
const testUsernames = {
  codechef: 'test_user_codechef', // Replace with real CodeChef username
  hackerrank: 'test_user_hackerrank' // Replace with real HackerRank username
};

async function testCodeChefData() {
  console.log('\n=== Testing CodeChef Data Retrieval ===');
  try {
    const data = await fetchCodeChefData(testUsernames.codechef);
    console.log('CodeChef Data Retrieved:');
    console.log('- Total Solved:', data.totalSolved);
    console.log('- Rating:', data.rating);
    console.log('- Rank:', data.rank);
    console.log('- Stars:', data.stars);
    console.log('- Country:', data.country);
    console.log('- Institution:', data.institution);
    console.log('- Member Since:', data.memberSince);
    console.log('- Practice Problems:', data.practiceProblems);
    console.log('- Contest Problems:', data.contestProblems);
    
    // Verify platform-specific fields are present
    if (data.stars !== undefined || data.country !== undefined || data.institution !== undefined) {
      console.log('✅ CodeChef platform-specific fields are working correctly');
    } else {
      console.log('❌ CodeChef platform-specific fields are missing');
    }
  } catch (error) {
    console.error('❌ Error testing CodeChef:', error.message);
  }
}

async function testHackerRankData() {
  console.log('\n=== Testing HackerRank Data Retrieval ===');
  try {
    const data = await fetchHackerRankData(testUsernames.hackerrank);
    console.log('HackerRank Data Retrieved:');
    console.log('- Total Solved:', data.totalSolved);
    console.log('- Rating:', data.rating);
    console.log('- Rank:', data.rank);
    console.log('- Country:', data.country);
    console.log('- School:', data.school);
    console.log('- Company:', data.company);
    console.log('- Job Title:', data.jobTitle);
    console.log('- Bio:', data.bio);
    
    // Verify platform-specific fields are present
    if (data.school !== undefined || data.company !== undefined || data.jobTitle !== undefined) {
      console.log('✅ HackerRank platform-specific fields are working correctly');
    } else {
      console.log('❌ HackerRank platform-specific fields are missing');
    }
  } catch (error) {
    console.error('❌ Error testing HackerRank:', error.message);
  }
}

async function testPlatformDifferences() {
  console.log('\n=== Testing Platform Differences ===');
  
  // Test that platforms return different data structures
  const codechefData = await fetchCodeChefData(testUsernames.codechef);
  const hackerrankData = await fetchHackerRankData(testUsernames.hackerrank);
  
  console.log('CodeChef has stars field:', 'stars' in codechefData);
  console.log('HackerRank has school field:', 'school' in hackerrankData);
  console.log('CodeChef has school field:', 'school' in codechefData);
  console.log('HackerRank has stars field:', 'stars' in hackerrankData);
  
  // Verify platforms are truly different
  if ('stars' in codechefData && !('stars' in hackerrankData) &&
      'school' in hackerrankData && !('school' in codechefData)) {
    console.log('✅ Platform-specific implementations are working correctly');
  } else {
    console.log('❌ Platform-specific implementations are not working correctly');
  }
}

async function runTests() {
  console.log('🚀 Starting Platform-Specific Data Retrieval Tests');
  console.log('Note: Replace test usernames with real usernames for actual testing');
  
  try {
    await testCodeChefData();
    await testHackerRankData();
    await testPlatformDifferences();
    
    console.log('\n✅ All tests completed!');
    console.log('\nTo test with real usernames:');
    console.log('1. Update testUsernames object with real usernames');
    console.log('2. Run: node test-platform-specific-data.js');
    console.log('3. Check the output for platform-specific data');
    
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }
}

// Run tests if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runTests();
}

export { testCodeChefData, testHackerRankData, testPlatformDifferences };
