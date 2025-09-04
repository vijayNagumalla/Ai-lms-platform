// Debug script for CodeChef HTML extraction
// This script helps debug why the HTML patterns are not working

import fetch from 'node-fetch';

const username = 'vijaynagamalla'; // Test username

async function debugCodeChefHTML() {
  console.log(`🔍 Debugging CodeChef HTML extraction for username: ${username}`);
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Referer': 'https://www.codechef.com/',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };

  try {
    console.log('📡 Fetching CodeChef profile page...');
    const response = await fetch(`https://www.codechef.com/users/${username}`, {
      headers,
      timeout: 15000
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const html = await response.text();
    console.log(`✅ HTML fetched successfully. Length: ${html.length} characters`);

    // Save HTML to file for inspection
    const fs = await import('fs');
    fs.writeFileSync('codechef-debug.html', html);
    console.log('💾 HTML saved to codechef-debug.html for inspection');

    // Test current patterns
    console.log('\n🧪 Testing current patterns:');
    
    const currentPatterns = [
      /(\d+)\s*problems?\s*solved/i,
      /problems?\s*solved[^>]*>(\d+)/i,
      /solved[^>]*>(\d+)/i,
      /Total Problems Solved[^>]*>(\d+)/i,
      /rating[^>]*>(\d+)/i,
      /(\d+)\s*rating/i,
      /Current Rating[^>]*>(\d+)/i,
      /(\d+)\s*stars?/i,
      /stars?[^>]*>(\d+)/i,
      /rank[^>]*>(\d+)/i,
      /(\d+)\s*rank/i,
      /Global Rank[^>]*>(\d+)/i,
      /(\d+)\s*practice/i,
      /practice[^>]*>(\d+)/i
    ];

    let foundData = {};
    
    for (const pattern of currentPatterns) {
      const match = html.match(pattern);
      if (match) {
        const number = parseInt(match[1]);
        if (pattern.toString().includes('problems') || pattern.toString().includes('solved')) {
          foundData.totalSolved = number;
          console.log(`✅ Found problems solved: ${number} using pattern: ${pattern}`);
        } else if (pattern.toString().includes('rating')) {
          foundData.rating = number;
          console.log(`✅ Found rating: ${number} using pattern: ${pattern}`);
        } else if (pattern.toString().includes('stars')) {
          foundData.stars = number;
          console.log(`✅ Found stars: ${number} using pattern: ${pattern}`);
        } else if (pattern.toString().includes('rank')) {
          foundData.rank = number;
          console.log(`✅ Found rank: ${number} using pattern: ${pattern}`);
        }
      }
    }

    // Test new improved patterns
    console.log('\n🔧 Testing improved patterns:');
    
    const improvedPatterns = [
      // More flexible problems solved patterns
      /(\d+)\s*(?:problems?|questions?)\s*(?:solved|completed)/i,
      /(?:problems?|questions?)\s*(?:solved|completed)[^>]*>(\d+)/i,
      /(?:solved|completed)[^>]*>(\d+)/i,
      /(\d+)\s*(?:solved|completed)/i,
      
      // Rating patterns
      /(?:current\s+)?rating[^>]*>(\d+)/i,
      /(\d+)\s*(?:current\s+)?rating/i,
      /rating[^>]*>(\d+)/i,
      
      // Stars patterns
      /(\d+)\s*(?:star|stars)/i,
      /(?:star|stars)[^>]*>(\d+)/i,
      
      // Rank patterns
      /(?:global|world)\s+rank[^>]*>(\d+)/i,
      /rank[^>]*>(\d+)/i,
      /(\d+)\s*rank/i,
      
      // Country and institution patterns
      /country[^>]*>([^<]+)/i,
      /institution[^>]*>([^<]+)/i,
      /member\s+since[^>]*>([^<]+)/i
    ];

    for (const pattern of improvedPatterns) {
      const match = html.match(pattern);
      if (match) {
        const value = match[1];
        if (pattern.toString().includes('country')) {
          foundData.country = value.trim();
          console.log(`✅ Found country: "${value.trim()}" using pattern: ${pattern}`);
        } else if (pattern.toString().includes('institution')) {
          foundData.institution = value.trim();
          console.log(`✅ Found institution: "${value.trim()}" using pattern: ${pattern}`);
        } else if (pattern.toString().includes('member')) {
          foundData.memberSince = value.trim();
          console.log(`✅ Found member since: "${value.trim()}" using pattern: ${pattern}`);
        }
      }
    }

    // Search for any numeric data that might be relevant
    console.log('\n🔍 Searching for any numeric data in HTML:');
    const numericMatches = html.match(/(\d+)\s*(?:problems?|questions?|solved|completed|rating|stars?|rank|practice|contests?)/gi);
    if (numericMatches) {
      console.log('Found potential numeric data:', numericMatches.slice(0, 10));
    }

    // Search for specific text patterns
    console.log('\n🔍 Searching for specific text patterns:');
    const textPatterns = [
      'problems solved',
      'rating',
      'stars',
      'rank',
      'country',
      'institution',
      'member since'
    ];

    for (const text of textPatterns) {
      const index = html.toLowerCase().indexOf(text.toLowerCase());
      if (index !== -1) {
        const context = html.substring(Math.max(0, index - 50), index + 100);
        console.log(`Found "${text}" at position ${index}:`);
        console.log(`Context: ${context.replace(/\s+/g, ' ').trim()}`);
      }
    }

    console.log('\n📊 Summary of found data:');
    console.log(foundData);

    if (Object.keys(foundData).length === 0) {
      console.log('\n❌ No data found with current patterns. HTML structure may have changed.');
      console.log('💡 Check the saved HTML file for manual inspection.');
    }

  } catch (error) {
    console.error('❌ Error debugging CodeChef HTML:', error.message);
  }
}

// Run the debug function
debugCodeChefHTML();

