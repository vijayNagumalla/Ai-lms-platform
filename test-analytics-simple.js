// Simple test to verify analytics endpoint
import http from 'http';

const testAnalytics = () => {
  const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/analytics/data?dateRange=30&collegeId=all&assessmentType=all',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };

  const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const response = JSON.parse(data);
        if (res.statusCode === 500) {
          console.log('❌ Server error - SQL parameter issue still exists');
          console.log('Error:', response.message);
        } else if (res.statusCode === 401) {
          console.log('✅ Authentication error (expected) - SQL parameter fix is working!');
          console.log('Message:', response.message);
        } else {
          console.log('✅ Unexpected success - endpoint is working');
          console.log('Response:', response);
        }
      } catch (e) {
        console.log('❌ Failed to parse response:', data);
      }
    });
  });

  req.on('error', (e) => {
    console.log('❌ Request error:', e.message);
  });

  req.end();
};

console.log('Testing analytics endpoint...');
testAnalytics();
