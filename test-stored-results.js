// Test script to verify stored coding results
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ai_lms_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function testStoredResults() {
  try {
    console.log('Testing stored coding results...\n');
    
    // Get recent assessment submissions with coding results
    const [submissions] = await pool.query(`
      SELECT 
        sub.id as submission_id,
        sub.assessment_id,
        sub.student_id,
        sub.submitted_at,
        csr.question_id,
        csr.language,
        csr.test_cases_passed,
        csr.total_test_cases,
        csr.score,
        csr.status,
        csr.code
      FROM assessment_submissions sub
      JOIN coding_submission_results csr ON sub.id = csr.submission_id
      ORDER BY sub.submitted_at DESC
      LIMIT 5
    `);
    
    if (submissions.length === 0) {
      console.log('No coding submissions found. Please submit a coding assessment first.');
      return;
    }
    
    console.log(`Found ${submissions.length} coding results:\n`);
    
    submissions.forEach((result, i) => {
      console.log(`Result ${i + 1}:`);
      console.log('Submission ID:', result.submission_id);
      console.log('Question ID:', result.question_id);
      console.log('Language:', result.language);
      console.log('Test Cases Passed:', result.test_cases_passed, '/', result.total_test_cases);
      console.log('Score:', result.score);
      console.log('Status:', result.status);
      console.log('Code (first 100 chars):', result.code ? result.code.substring(0, 100) + '...' : 'No code');
      console.log('---');
    });
    
    // Test the results retrieval logic
    if (submissions.length > 0) {
      const testSubmission = submissions[0];
      console.log('\nTesting results retrieval for submission:', testSubmission.submission_id);
      
      // Get the coding results for this submission
      const [codingResults] = await pool.query(
        'SELECT * FROM coding_submission_results WHERE submission_id = ?',
        [testSubmission.submission_id]
      );
      
      console.log('Coding results found:', codingResults.length);
      
      codingResults.forEach((result, i) => {
        console.log(`\nCoding Result ${i + 1}:`);
        console.log('Question ID:', result.question_id);
        console.log('Language:', result.language);
        console.log('Test Cases Passed:', result.test_cases_passed, '/', result.total_test_cases);
        console.log('Score:', result.score);
        console.log('Status:', result.status);
        
        // Parse feedback to see test results structure
        if (result.feedback) {
          try {
            const feedback = JSON.parse(result.feedback);
            console.log('Feedback structure:', typeof feedback);
            if (Array.isArray(feedback)) {
              console.log('Number of test results:', feedback.length);
              if (feedback.length > 0) {
                console.log('First test result structure:', Object.keys(feedback[0]));
              }
            }
          } catch (e) {
            console.log('Error parsing feedback:', e.message);
          }
        }
      });
    }
    
  } catch (error) {
    console.error('Error testing stored results:', error);
  } finally {
    await pool.end();
  }
}

testStoredResults(); 