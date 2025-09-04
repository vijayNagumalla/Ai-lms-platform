// Test script to verify results display structure
import DockerCodeService from './backend/services/dockerCodeService.js';

async function testResultsDisplay() {
  console.log('Testing Results Display Structure...');
  
  try {
    // Simulate a coding question result structure
    const mockQuestion = {
      id: 'test-coding-1',
      question_type: 'coding',
      question_text: 'Write a Program for Even or Odd',
      points: 20,
      user_answer: {
        language: 'python',
        code: `n = int(input())
if n % 2 == 0:
    print("even")
else:
    print("odd")`
      },
      coding_result: {
        testCasesPassed: 2,
        totalTestCases: 3,
        score: 67,
        language: 'python',
        code: `n = int(input())
if n % 2 == 0:
    print("even")
else:
    print("odd")`,
        testResults: [
          {
            testCase: { input: '4', expected_output: 'even' },
            result: { verdict: { status: 'accepted' }, output: 'even' }
          },
          {
            testCase: { input: '7', expected_output: 'odd' },
            result: { verdict: { status: 'accepted' }, output: 'odd' }
          },
          {
            testCase: { input: '0', expected_output: 'even' },
            result: { verdict: { status: 'wrong_answer' }, output: 'odd', error: 'Incorrect output' }
          }
        ]
      },
      is_correct: false
    };
    
    console.log('Mock question structure:');
    console.log(JSON.stringify(mockQuestion, null, 2));
    
    // Test language extraction
    const language = mockQuestion.coding_result.language || 
                   (mockQuestion.user_answer && typeof mockQuestion.user_answer === 'object' && mockQuestion.user_answer.language) || 
                   'Not specified';
    
    console.log('Extracted language:', language);
    
    // Test code extraction
    const code = mockQuestion.coding_result.code || mockQuestion.user_answer || 'No code provided';
    console.log('Extracted code:', code);
    
    // Test test case summary
    const testCaseSummary = {
      passed: mockQuestion.coding_result.testCasesPassed,
      total: mockQuestion.coding_result.totalTestCases,
      score: mockQuestion.coding_result.score
    };
    
    console.log('Test case summary:', testCaseSummary);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testResultsDisplay(); 