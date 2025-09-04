const fetch = require('node-fetch');

const API_BASE_URL = 'http://localhost:5000/api';

async function testProfileFetch() {
  console.log('Testing coding profile data fetching...\n');
  
  try {
    // Test 1: Check platform health
    console.log('1. Checking platform health...');
    const healthResponse = await fetch(`${API_BASE_URL}/coding-profiles/health`);
    const healthData = await healthResponse.json();
    console.log('Platform Health:', JSON.stringify(healthData, null, 2));
    console.log('');
    
    // Test 2: Get available platforms
    console.log('2. Getting available platforms...');
    const platformsResponse = await fetch(`${API_BASE_URL}/coding-profiles/platforms`);
    const platformsData = await platformsResponse.json();
    console.log('Available Platforms:', JSON.stringify(platformsData, null, 2));
    console.log('');
    
    // Test 3: Test LeetCode data fetching
    console.log('3. Testing LeetCode data fetching...');
    const leetcodePlatform = platformsData.data?.find(p => p.name === 'leetcode');
    if (leetcodePlatform) {
      const testResponse = await fetch(`${API_BASE_URL}/coding-profiles/test/${leetcodePlatform.id}/testuser`);
      const testData = await testResponse.json();
      console.log('LeetCode Test Result:', JSON.stringify(testData, null, 2));
    } else {
      console.log('LeetCode platform not found');
    }
    console.log('');
    
    // Test 4: Test HackerRank data fetching
    console.log('4. Testing HackerRank data fetching...');
    const hackerrankPlatform = platformsData.data?.find(p => p.name === 'hackerrank');
    if (hackerrankPlatform) {
      const testResponse = await fetch(`${API_BASE_URL}/coding-profiles/test/${hackerrankPlatform.id}/testuser`);
      const testData = await testResponse.json();
      console.log('HackerRank Test Result:', JSON.stringify(testData, null, 2));
    } else {
      console.log('HackerRank platform not found');
    }
    console.log('');
    
    // Test 5: Test CodeChef data fetching
    console.log('5. Testing CodeChef data fetching...');
    const codechefPlatform = platformsData.data?.find(p => p.name === 'codechef');
    if (codechefPlatform) {
      const testResponse = await fetch(`${API_BASE_URL}/coding-profiles/test/${codechefPlatform.id}/testuser`);
      const testData = await testResponse.json();
      console.log('CodeChef Test Result:', JSON.stringify(testData, null, 2));
    } else {
      console.log('CodeChef platform not found');
    }
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testProfileFetch();
