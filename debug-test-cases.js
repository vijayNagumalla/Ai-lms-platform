// Debug script to examine test case structure
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

async function debugTestCases() {
  try {
    console.log('Debugging test case structure...\n');
    
    // Check coding questions table
    console.log('1. Checking coding_questions table:');
    const [codingQuestions] = await pool.query(
      'SELECT id, question_id, test_cases, language FROM coding_questions LIMIT 5'
    );
    
    codingQuestions.forEach((q, i) => {
      console.log(`\nCoding Question ${i + 1}:`);
      console.log('ID:', q.id);
      console.log('Question ID:', q.question_id);
      console.log('Language:', q.language);
      console.log('Test Cases (raw):', q.test_cases);
      
      if (q.test_cases) {
        try {
          const parsed = typeof q.test_cases === 'string' ? JSON.parse(q.test_cases) : q.test_cases;
          console.log('Test Cases (parsed):', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Error parsing test cases:', e.message);
        }
      }
    });
    
    // Check questions table for metadata
    console.log('\n\n2. Checking questions table metadata:');
    const [questions] = await pool.query(
      'SELECT id, question_type, metadata FROM questions WHERE question_type = "coding" LIMIT 5'
    );
    
    questions.forEach((q, i) => {
      console.log(`\nQuestion ${i + 1}:`);
      console.log('ID:', q.id);
      console.log('Type:', q.question_type);
      console.log('Metadata (raw):', q.metadata);
      
      if (q.metadata) {
        try {
          const parsed = typeof q.metadata === 'string' ? JSON.parse(q.metadata) : q.metadata;
          console.log('Metadata (parsed):', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Error parsing metadata:', e.message);
        }
      }
    });
    
    // Check assessment templates for sections
    console.log('\n\n3. Checking assessment templates sections:');
    const [assessments] = await pool.query(
      'SELECT id, title, sections FROM assessment_templates LIMIT 3'
    );
    
    assessments.forEach((a, i) => {
      console.log(`\nAssessment ${i + 1}:`);
      console.log('ID:', a.id);
      console.log('Title:', a.title);
      console.log('Sections (raw):', a.sections ? a.sections.substring(0, 200) + '...' : 'null');
      
      if (a.sections) {
        try {
          const parsed = typeof a.sections === 'string' ? JSON.parse(a.sections) : a.sections;
          console.log('Sections (parsed):', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Error parsing sections:', e.message);
        }
      }
    });
    
    // Check assessment submissions for answers
    console.log('\n\n4. Checking assessment submissions:');
    const [submissions] = await pool.query(
      'SELECT id, assessment_id, answers FROM assessment_submissions WHERE answers IS NOT NULL LIMIT 3'
    );
    
    submissions.forEach((s, i) => {
      console.log(`\nSubmission ${i + 1}:`);
      console.log('ID:', s.id);
      console.log('Assessment ID:', s.assessment_id);
      console.log('Answers (raw):', s.answers ? s.answers.substring(0, 200) + '...' : 'null');
      
      if (s.answers) {
        try {
          const parsed = typeof s.answers === 'string' ? JSON.parse(s.answers) : s.answers;
          console.log('Answers (parsed):', JSON.stringify(parsed, null, 2));
        } catch (e) {
          console.log('Error parsing answers:', e.message);
        }
      }
    });
    
  } catch (error) {
    console.error('Error debugging test cases:', error);
  } finally {
    await pool.end();
  }
}

debugTestCases(); 