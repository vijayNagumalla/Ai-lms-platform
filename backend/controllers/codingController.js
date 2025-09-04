import { pool } from '../config/database.js';
import dockerCodeService from '../services/dockerCodeService.js';

// Execute code
export const executeCode = async (req, res) => {
  try {
    const { sourceCode, language, input, expectedOutput } = req.body;

    // Validate required fields
    if (!sourceCode || !language) {
      return res.status(400).json({
        success: false,
        message: 'Source code and language are required'
      });
    }

    // Execute code
    const result = await dockerCodeService.executeCode(sourceCode, language, input || '', expectedOutput || '');

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: result.error
      });
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Execute code error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Run test cases
export const runTestCases = async (req, res) => {
  try {
    const { sourceCode, language, testCases } = req.body;

    // Validate required fields
    if (!sourceCode || !language || !testCases || !Array.isArray(testCases)) {
      return res.status(400).json({
        success: false,
        message: 'Source code, language, and test cases array are required'
      });
    }



    // Optimized batch test case execution using single Docker container
    let results = [];
    
    try {
      const config = dockerCodeService.getLanguageConfig(language);
      const { filename, filepath } = await dockerCodeService.createTempFile(sourceCode, config.extension);
      
      // Use optimized batch execution method (with optional pooling)
      const usePooling = process.env.DOCKER_CONTAINER_POOLING === 'true';
      results = usePooling ? 
        await dockerCodeService.executeBatchTestCasesWithPool(filepath, config, testCases) :
        await dockerCodeService.executeBatchTestCases(filepath, config, testCases);
      
      // Clean up
      await dockerCodeService.cleanupTempFiles([filepath]);
    } catch (error) {
      console.error('Batch test case execution error:', error);
      throw error;
    }

    // Calculate summary
    const passed = results.filter(r => r.result.success && r.result.verdict?.status === 'accepted').length;
    const total = results.length;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          passed,
          total,
          failed: total - passed,
          percentage: total > 0 ? Math.round((passed / total) * 100) : 0
        }
      }
    });
  } catch (error) {
    console.error('Run test cases error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get supported languages
export const getSupportedLanguages = async (req, res) => {
  try {
    // Return the languages supported by our Docker service
    const supportedLanguages = [
      { name: 'JavaScript', value: 'javascript', version: 'Node.js 18' },
      { name: 'Python', value: 'python', version: 'Python 3.11' },
      { name: 'Java', value: 'java', version: 'OpenJDK 17' },
      { name: 'C++', value: 'cpp', version: 'GCC 12' },
      { name: 'C', value: 'c', version: 'GCC 12' },
      { name: 'PHP', value: 'php', version: 'PHP 8.2' },
      { name: 'Ruby', value: 'ruby', version: 'Ruby 3.2' },
      { name: 'Go', value: 'go', version: 'Go 1.21' },
      { name: 'Rust', value: 'rust', version: 'Rust 1.75' }
    ];

    res.json({
      success: true,
      data: supportedLanguages
    });
  } catch (error) {
    console.error('Get supported languages error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Get language templates (starter code)
export const getLanguageTemplates = async (req, res) => {
  try {
    const templates = {
      python: `# Write your Python code here
def main():
    # Your code goes here
    print("Hello, World!")

if __name__ == "__main__":
    main()`,

      javascript: `// Write your JavaScript code here
function main() {
    // Your code goes here
    console.log("Hello, World!");
}

main();`,

      java: `// Write your Java code here
public class Main {
    public static void main(String[] args) {
        // Your code goes here
        System.out.println("Hello, World!");
    }
}`,

      cpp: `// Write your C++ code here
#include <iostream>
using namespace std;

int main() {
    // Your code goes here
    cout << "Hello, World!" << endl;
    return 0;
}`,

      csharp: `// Write your C# code here
using System;

class Program {
    static void Main(string[] args) {
        // Your code goes here
        Console.WriteLine("Hello, World!");
    }
}`,

      go: `// Write your Go code here
package main

import "fmt"

func main() {
    // Your code goes here
    fmt.Println("Hello, World!")
}`,

      ruby: `# Write your Ruby code here
def main
  # Your code goes here
  puts "Hello, World!"
end

main`,

      php: `<?php
// Write your PHP code here
function main() {
    // Your code goes here
    echo "Hello, World!";
}

main();
?>`
    };

    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Get language templates error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Verify coding question test cases
export const verifyCodingQuestion = async (req, res) => {
  try {
    const { questionId, sourceCode, language } = req.body;

    // Validate required fields
    if (!questionId || !sourceCode || !language) {
      return res.status(400).json({
        success: false,
        message: 'Question ID, source code, and language are required'
      });
    }

    // Get question and its test cases from database
    const [questions] = await pool.execute(
      'SELECT * FROM questions WHERE id = ?',
      [questionId]
    );

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Question not found'
      });
    }

    const question = questions[0];
    
    // Parse coding details
    let codingDetails = {};
    try {
      codingDetails = question.metadata ? 
        (typeof question.metadata === 'string' ? 
          JSON.parse(question.metadata) : question.metadata) : {};
    } catch (e) {
      console.warn('Failed to parse metadata for question', questionId);
    }

    const testCases = codingDetails.test_cases || [];

    if (testCases.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No test cases found for this question'
      });
    }

    // Run test cases using optimized batch Docker service
    let results = [];
    
    try {
      const config = dockerCodeService.getLanguageConfig(language);
      const { filename, filepath } = await dockerCodeService.createTempFile(sourceCode, config.extension);
      
      // Use optimized batch execution method (with optional pooling)
      const usePooling = process.env.DOCKER_CONTAINER_POOLING === 'true';
      results = usePooling ? 
        await dockerCodeService.executeBatchTestCasesWithPool(filepath, config, testCases) :
        await dockerCodeService.executeBatchTestCases(filepath, config, testCases);
      
      // Clean up
      await dockerCodeService.cleanupTempFiles([filepath]);
    } catch (error) {
      console.error('Batch test case execution error during verification:', error);
      throw error;
    }

    // Calculate summary
    const passed = results.filter(r => r.result.success && r.result.verdict?.status === 'accepted').length;
    const total = results.length;

    // Determine if all test cases passed
    const allPassed = passed === total;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          passed,
          total,
          failed: total - passed,
          percentage: total > 0 ? Math.round((passed / total) * 100) : 0,
          allPassed
        },
        question: {
          id: question.id,
          title: question.title,
          points: question.points
        }
      }
    });
  } catch (error) {
    console.error('Verify coding question error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

// Health check for Docker code execution service
export const healthCheck = async (req, res) => {
  try {
    // Test with a simple Python code execution
    const testResult = await dockerCodeService.executeCode({
      code: 'print("Hello, World!")',
      language: 'python',
      input: '',
      expectedOutput: 'Hello, World!'
    });
    
    res.json({
      success: testResult.success,
      message: testResult.success ? 'Docker code execution service is healthy' : 'Service is not responding properly',
      details: testResult
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};

// Get submission status (not applicable for Docker service, but kept for API compatibility)
export const getSubmissionStatus = async (req, res) => {
  try {
    const { submissionId } = req.params;

    if (!submissionId) {
      return res.status(400).json({
        success: false,
        message: 'Submission ID is required'
      });
    }

    res.json({
      success: false,
      message: 'Submission status not available with Docker execution service. Use direct code execution instead.'
    });
  } catch (error) {
    console.error('Get submission status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
}; 