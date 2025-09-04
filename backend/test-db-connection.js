import mysql from 'mysql2/promise';

const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'lms_platform',
  port: 3306
};

async function testConnection() {
  let connection;
  try {
    console.log('🔌 Testing database connection...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ Database connection successful!');
    
    // Check if coding_profiles table exists
    console.log('\n📋 Checking for coding_profiles table...');
    const [tables] = await connection.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name = 'coding_profiles'
    `);
    
    if (tables.length > 0) {
      console.log('✅ coding_profiles table already exists');
    } else {
      console.log('❌ coding_profiles table does not exist, creating it...');
      
      // Create the table manually
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS coding_platforms (
          id VARCHAR(36) PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          display_name VARCHAR(100) NOT NULL,
          base_url VARCHAR(500) NOT NULL,
          api_endpoint VARCHAR(500),
          is_active BOOLEAN DEFAULT TRUE,
          rate_limit_per_minute INT DEFAULT 60,
          api_key VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Created coding_platforms table');
      
      await connection.execute(`
        CREATE TABLE IF NOT EXISTS coding_profiles (
          id VARCHAR(36) PRIMARY KEY,
          user_id VARCHAR(36) NOT NULL,
          platform_id VARCHAR(36) NOT NULL,
          username VARCHAR(100) NOT NULL,
          profile_url VARCHAR(500),
          total_solved INT DEFAULT 0,
          rating INT DEFAULT 0,
          rank INT DEFAULT 0,
          contribution_points INT DEFAULT 0,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          is_active BOOLEAN DEFAULT TRUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          UNIQUE KEY unique_user_platform (user_id, platform_id)
        )
      `);
      console.log('✅ Created coding_profiles table');
      
      // Insert default platforms
      await connection.execute(`
        INSERT IGNORE INTO coding_platforms (id, name, display_name, base_url, api_endpoint, is_active) VALUES
        ('leetcode-platform', 'leetcode', 'LeetCode', 'https://leetcode.com', 'https://leetcode.com/api', TRUE),
        ('hackerrank-platform', 'hackerrank', 'HackerRank', 'https://www.hackerrank.com', 'https://www.hackerrank.com/api', TRUE),
        ('codechef-platform', 'codechef', 'CodeChef', 'https://www.codechef.com', 'https://www.codechef.com/api', TRUE)
      `);
      console.log('✅ Inserted default coding platforms');
    }
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testConnection();

