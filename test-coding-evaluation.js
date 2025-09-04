// Test script for coding question evaluation
import DockerCodeService from './backend/services/dockerCodeService.js';

async function testCodingEvaluation() {
  console.log('Testing Coding Question Evaluation...');
  
  try {
    // Test case 1: Python even/odd program
    const testQuestion = {
      id: 'test-1',
      question_type: 'coding',
      coding_details: {
        test_cases: [
          {
            input: '4',
            expected_output: 'even'
          },
          {
            input: '7',
            expected_output: 'odd'
          },
          {
            input: '0',
            expected_output: 'even'
          }
        ],
        languages: ['python']
      }
    };
    
    const userAnswer = {
      language: 'python',
      code: `n = int(input())
if n % 2 == 0:
    print("even")
else:
    print("odd")`
    };
    
    console.log('Test question:', testQuestion);
    console.log('User answer:', userAnswer);
    
    // Test Docker service directly
    const config = DockerCodeService.getLanguageConfig('python');
    console.log('Language config:', config);
    
    const { filepath } = await DockerCodeService.createTempFile(userAnswer.code, config.extension);
    console.log('Created temp file:', filepath);
    
    try {
      const result = await DockerCodeService.executeBatchTestCases(filepath, config, testQuestion.coding_details.test_cases);
      console.log('Test execution result:', result);
      
      // Check results
      const passedTests = result.filter(testResult => 
        testResult.result?.verdict?.status === 'accepted'
      ).length;
      const totalTests = result.length;
      
      console.log(`Results: ${passedTests}/${totalTests} test cases passed`);
      
    } finally {
      await DockerCodeService.cleanupTempFiles([filepath]);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testCodingEvaluation(); 