// Check database schema
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'lms_platform',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function checkSchema() {
  try {
    console.log('Checking database schema...\n');
    
    // Check coding_submission_results table structure
    console.log('1. coding_submission_results table structure:');
    const [codingResultsStructure] = await pool.query(
      'DESCRIBE coding_submission_results'
    );
    
    codingResultsStructure.forEach(field => {
      console.log(`  ${field.Field}: ${field.Type} ${field.Null === 'YES' ? 'NULL' : 'NOT NULL'} ${field.Key ? `(${field.Key})` : ''}`);
    });
    
    // Check foreign key constraints
    console.log('\n2. Foreign key constraints:');
    const [foreignKeys] = await pool.query(`
      SELECT 
        CONSTRAINT_NAME,
        TABLE_NAME,
        COLUMN_NAME,
        REFERENCED_TABLE_NAME,
        REFERENCED_COLUMN_NAME
      FROM information_schema.KEY_COLUMN_USAGE 
      WHERE TABLE_SCHEMA = ? 
      AND REFERENCED_TABLE_NAME IS NOT NULL
      AND TABLE_NAME = 'coding_submission_results'
         `, [process.env.DB_NAME || 'lms_platform']);
    
    foreignKeys.forEach(fk => {
      console.log(`  ${fk.CONSTRAINT_NAME}: ${fk.TABLE_NAME}.${fk.COLUMN_NAME} -> ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
    });
    
    // Check assessment_questions table
    console.log('\n3. assessment_questions table:');
    const [assessmentQuestionsStructure] = await pool.query(
      'DESCRIBE assessment_questions'
    );
    
    console.log('  Structure:');
    assessmentQuestionsStructure.forEach(field => {
      console.log(`    ${field.Field}: ${field.Type} ${field.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
    });
    
    const [assessmentQuestions] = await pool.query(
      'SELECT * FROM assessment_questions LIMIT 3'
    );
    
    if (assessmentQuestions.length === 0) {
      console.log('  No assessment_questions found');
    } else {
      assessmentQuestions.forEach((q, i) => {
        console.log(`  Question ${i + 1}: ID=${q.id}, Text="${q.question_text?.substring(0, 50)}..."`);
      });
    }
    
    // Check if questions from sections exist in assessment_questions
    console.log('\n4. Checking question IDs from sections:');
    const [sections] = await pool.query(
      'SELECT sections FROM assessment_templates WHERE sections IS NOT NULL LIMIT 1'
    );
    
    if (sections.length > 0) {
      try {
        const sectionsData = JSON.parse(sections[0].sections);
        const questionIds = [];
        
        sectionsData.forEach(section => {
          if (section.questions) {
            section.questions.forEach(question => {
              questionIds.push(question.id);
            });
          }
        });
        
        console.log('  Question IDs from sections:', questionIds);
        
        // Check which ones exist in assessment_questions
        if (questionIds.length > 0) {
          const placeholders = questionIds.map(() => '?').join(',');
          const [existingQuestions] = await pool.query(
            `SELECT id FROM assessment_questions WHERE id IN (${placeholders})`,
            questionIds
          );
          
          console.log('  Existing in assessment_questions:', existingQuestions.map(q => q.id));
          console.log('  Missing from assessment_questions:', questionIds.filter(id => !existingQuestions.find(q => q.id === id)));
        }
      } catch (error) {
        console.log('  Error parsing sections:', error.message);
      }
    }
    
  } catch (error) {
    console.error('Error checking schema:', error);
  } finally {
    await pool.end();
  }
}

checkSchema(); 