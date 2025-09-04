// Migration script to generate stored coding results for existing submissions
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

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

async function migrateExistingSubmissions() {
  try {
    console.log('Starting migration of existing submissions...\n');
    
    // Get all submitted assessments that don't have coding results
    const [submissions] = await pool.query(`
      SELECT DISTINCT 
        sub.id as submission_id,
        sub.assessment_id,
        sub.student_id,
        sub.answers,
        sub.submitted_at
      FROM assessment_submissions sub
      WHERE sub.status = 'submitted'
      AND NOT EXISTS (
        SELECT 1 FROM coding_submission_results csr 
        WHERE csr.submission_id = sub.id
      )
      ORDER BY sub.submitted_at DESC
    `);
    
    if (submissions.length === 0) {
      console.log('No submissions found that need migration.');
      return;
    }
    
    console.log(`Found ${submissions.length} submissions to migrate.\n`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    for (const submission of submissions) {
      try {
        console.log(`Processing submission: ${submission.submission_id}`);
        
        // Parse answers
        const answers = typeof submission.answers === 'string' ? 
          JSON.parse(submission.answers) : submission.answers;
        
        // Get assessment template
        const [assessmentTemplate] = await pool.query(
          'SELECT * FROM assessment_templates WHERE id = ?',
          [submission.assessment_id]
        );
        
        if (assessmentTemplate.length === 0) {
          console.log(`  Skipping: Assessment template not found`);
          continue;
        }
        
        const assessment = assessmentTemplate[0];
        
        // Extract questions from sections
        let allQuestions = [];
        if (assessment.sections) {
          try {
            let sections;
            if (typeof assessment.sections === 'string') {
              sections = JSON.parse(assessment.sections);
            } else if (typeof assessment.sections === 'object') {
              sections = assessment.sections;
            } else {
              sections = [];
            }
            
            if (Array.isArray(sections)) {
              sections.forEach((section, sectionIndex) => {
                if (section.questions && Array.isArray(section.questions)) {
                  section.questions.forEach((question, questionIndex) => {
                    const questionWithSection = {
                      ...question,
                      section_id: section.id,
                      section_name: section.name,
                      section_order: sectionIndex + 1,
                      question_order: questionIndex + 1,
                      question_text: question.content || question.question_text || question.title || 'Question'
                    };
                    allQuestions.push(questionWithSection);
                  });
                }
              });
            }
          } catch (error) {
            console.log(`  Error parsing sections: ${error.message}`);
            continue;
          }
        }
        
        // Process each coding question
        for (const question of allQuestions) {
          if (question.question_type === 'coding') {
            const userAnswer = answers[question.id];
            
            if (userAnswer) {
              console.log(`  Processing coding question: ${question.id}`);
              
              // Get coding details from question bank
              const [codingDetails] = await pool.query(
                'SELECT * FROM coding_questions WHERE question_id = ?',
                [question.id]
              );
              
              if (codingDetails.length > 0) {
                const codingDetail = codingDetails[0];
                const testCases = codingDetail.test_cases ? 
                  (typeof codingDetail.test_cases === 'string' ? 
                    JSON.parse(codingDetail.test_cases) : codingDetail.test_cases) : [];
                
                if (testCases.length > 0) {
                  // Determine language
                  let language = codingDetail.language || 'javascript';
                  if (typeof userAnswer === 'string') {
                    if (userAnswer.includes('python') || userAnswer.includes('print(')) {
                      language = 'python';
                    } else if (userAnswer.includes('java') || userAnswer.includes('public class')) {
                      language = 'java';
                    } else if (userAnswer.includes('cpp') || userAnswer.includes('#include')) {
                      language = 'cpp';
                    }
                  }
                  
                  // Create mock evaluation result
                  const mockEvaluation = {
                    isCorrect: false,
                    passedTests: 0,
                    totalTests: testCases.length,
                    score: 0,
                    testResults: testCases.map(testCase => ({
                      testCase: testCase,
                      result: {
                        success: false,
                        output: '',
                        error: 'Evaluation not available for historical submissions',
                        verdict: {
                          status: 'error',
                          message: 'Historical submission - evaluation not performed'
                        }
                      }
                    }))
                  };
                  
                  // Insert coding submission result
                  const codingResultId = uuidv4();
                  const sourceCode = typeof userAnswer === 'string' ? 
                    userAnswer : 
                    (userAnswer && userAnswer.code ? userAnswer.code : '');
                  
                                     await pool.query(`
                     INSERT INTO coding_submission_results (
                       id, submission_id, question_id, code, language, status,
                       test_cases_passed, total_test_cases, score, feedback
                     ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                   `, [
                     codingResultId,
                     submission.submission_id,
                     question.id,
                     sourceCode,
                     language,
                     'wrong_answer',
                     mockEvaluation.passedTests,
                     mockEvaluation.totalTests,
                     mockEvaluation.score,
                     JSON.stringify(mockEvaluation.testResults)
                   ]);
                  
                  console.log(`    Created historical result for question ${question.id}`);
                  migratedCount++;
                }
              }
            }
          }
        }
        
      } catch (error) {
        console.error(`  Error processing submission ${submission.submission_id}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`\nMigration completed:`);
    console.log(`- Successfully migrated: ${migratedCount} coding results`);
    console.log(`- Errors: ${errorCount}`);
    
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

migrateExistingSubmissions(); 