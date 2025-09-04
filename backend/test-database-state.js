// Test script to check database state
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

async function checkDatabaseState() {
  try {
    console.log('Checking database state...\n');
    
    // Check assessment submissions
    console.log('1. Assessment Submissions:');
    const [submissions] = await pool.query(
      'SELECT id, assessment_id, student_id, status, submitted_at FROM assessment_submissions ORDER BY submitted_at DESC LIMIT 5'
    );
    
    if (submissions.length === 0) {
      console.log('No assessment submissions found.');
    } else {
      submissions.forEach((sub, i) => {
        console.log(`Submission ${i + 1}: ID=${sub.id}, Assessment=${sub.assessment_id}, Student=${sub.student_id}, Status=${sub.status}, Date=${sub.submitted_at}`);
      });
    }
    
    // Check coding submission results
    console.log('\n2. Coding Submission Results:');
    const [codingResults] = await pool.query(
      'SELECT id, submission_id, question_id, language, test_cases_passed, total_test_cases, score FROM coding_submission_results ORDER BY id DESC LIMIT 5'
    );
    
    if (codingResults.length === 0) {
      console.log('No coding submission results found.');
    } else {
      codingResults.forEach((result, i) => {
        console.log(`Result ${i + 1}: ID=${result.id}, Submission=${result.submission_id}, Question=${result.question_id}, Language=${result.language}, Passed=${result.test_cases_passed}/${result.total_test_cases}, Score=${result.score}`);
      });
    }
    
    // Check assessment templates
    console.log('\n3. Assessment Templates:');
    const [templates] = await pool.query(
      'SELECT id, title, status FROM assessment_templates ORDER BY id DESC LIMIT 5'
    );
    
    if (templates.length === 0) {
      console.log('No assessment templates found.');
    } else {
      templates.forEach((template, i) => {
        console.log(`Template ${i + 1}: ID=${template.id}, Title="${template.title}", Status=${template.status}`);
      });
    }
    
    // Check coding questions
    console.log('\n4. Coding Questions:');
    const [codingQuestions] = await pool.query(
      'SELECT id, question_id, language, test_cases FROM coding_questions ORDER BY id DESC LIMIT 5'
    );
    
    if (codingQuestions.length === 0) {
      console.log('No coding questions found.');
    } else {
      codingQuestions.forEach((q, i) => {
        console.log(`Question ${i + 1}: ID=${q.id}, QuestionID=${q.question_id}, Language=${q.language}, TestCases=${q.test_cases ? 'Yes' : 'No'}`);
      });
    }
    
    // Check users
    console.log('\n5. Users:');
    const [users] = await pool.query(
      'SELECT id, name, email, role FROM users ORDER BY id DESC LIMIT 5'
    );
    
    if (users.length === 0) {
      console.log('No users found.');
    } else {
      users.forEach((user, i) => {
        console.log(`User ${i + 1}: ID=${user.id}, Name=${user.name}, Email=${user.email}, Role=${user.role}`);
      });
    }
    
  } catch (error) {
    console.error('Error checking database state:', error);
  } finally {
    await pool.end();
  }
}

checkDatabaseState(); 