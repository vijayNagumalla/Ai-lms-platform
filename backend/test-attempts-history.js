// Test script for attempts history endpoint
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

async function testAttemptsHistory() {
  try {
    console.log('Testing attempts history functionality...\n');
    
    // Get a sample assessment with submissions
    const [assessments] = await pool.query(`
      SELECT DISTINCT 
        sub.assessment_id,
        a.title,
        a.max_attempts,
        a.time_between_attempts_hours,
        COUNT(sub.id) as submission_count
      FROM assessment_submissions sub
      JOIN assessment_templates a ON sub.assessment_id = a.id
      WHERE sub.status = 'submitted'
      GROUP BY sub.assessment_id
      HAVING submission_count > 0
      LIMIT 3
    `);
    
    if (assessments.length === 0) {
      console.log('No assessments with submissions found.');
      return;
    }
    
    console.log(`Found ${assessments.length} assessments with submissions:\n`);
    
    for (const assessment of assessments) {
      console.log(`Assessment: ${assessment.title} (ID: ${assessment.assessment_id})`);
      console.log(`Max attempts: ${assessment.max_attempts || 'Unlimited'}`);
      console.log(`Time between attempts: ${assessment.time_between_attempts_hours || 0} hours`);
      console.log(`Total submissions: ${assessment.submission_count}`);
      
      // Get attempts for this assessment
      const [attempts] = await pool.query(`
        SELECT 
          sub.id,
          sub.student_id,
          sub.attempt_number,
          sub.percentage_score,
          sub.time_taken_minutes,
          sub.status,
          sub.submitted_at,
          sub.started_at,
          COUNT(csr.id) as coding_questions_count
        FROM assessment_submissions sub
        LEFT JOIN coding_submission_results csr ON sub.id = csr.submission_id
        WHERE sub.assessment_id = ? AND sub.status = 'submitted'
        GROUP BY sub.id, sub.attempt_number, sub.percentage_score, sub.time_taken_minutes, sub.status, sub.submitted_at, sub.started_at
        ORDER BY sub.attempt_number DESC
        LIMIT 5
      `, [assessment.assessment_id]);
      
      console.log(`Attempts found: ${attempts.length}`);
      
      attempts.forEach((attempt, index) => {
        console.log(`  Attempt ${index + 1}:`);
        console.log(`    Student: ${attempt.student_id}`);
        console.log(`    Attempt #: ${attempt.attempt_number}`);
        console.log(`    Score: ${attempt.percentage_score}%`);
        console.log(`    Time: ${attempt.time_taken_minutes} min`);
        console.log(`    Date: ${attempt.submitted_at}`);
        console.log(`    Coding questions: ${attempt.coding_questions_count}`);
      });
      
      // Test the logic for next attempt
      const maxAttemptNumber = attempts.length > 0 ? Math.max(...attempts.map(a => a.attempt_number)) : 0;
      const nextAttemptNumber = maxAttemptNumber + 1;
      const canAttempt = !assessment.max_attempts || attempts.length < assessment.max_attempts;
      
      console.log(`\nAttempt logic:`);
      console.log(`  Max attempt number: ${maxAttemptNumber}`);
      console.log(`  Next attempt number: ${nextAttemptNumber}`);
      console.log(`  Can attempt: ${canAttempt}`);
      console.log('---\n');
    }
    
  } catch (error) {
    console.error('Error testing attempts history:', error);
  } finally {
    await pool.end();
  }
}

testAttemptsHistory(); 