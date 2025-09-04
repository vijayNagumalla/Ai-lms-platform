import axios from 'axios';

class Judge0Service {
  constructor() {
    // Judge0 API configuration - update with your self-hosted instance URL
    this.baseURL = process.env.JUDGE0_URL || 'http://localhost:2358';
    this.apiKey = process.env.JUDGE0_API_KEY || '';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'X-RapidAPI-Key': this.apiKey })
      },
      timeout: 30000 // 30 seconds timeout
    });

    // Language ID mapping for Judge0
    this.languageIds = {
      'python': 71,        // Python (3.8.1)
      'javascript': 63,    // JavaScript (Node.js 12.14.0)
      'java': 62,          // Java (OpenJDK 13.0.1)
      'cpp': 54,           // C++ (GCC 9.2.0)
      'csharp': 51,        // C# (Mono 6.6.0.161)
      'go': 60,            // Go (1.13.5)
      'ruby': 72,          // Ruby (2.7.0)
      'php': 68,           // PHP (7.4.1)
      'c': 50,             // C (GCC 9.2.0)
      'typescript': 74,    // TypeScript (3.7.4)
      'rust': 73,          // Rust (1.40.0)
      'swift': 83,         // Swift (5.2.3)
      'kotlin': 78,        // Kotlin (1.3.70)
      'scala': 81,         // Scala (2.13.2)
      'r': 80,             // R (4.0.0)
      'dart': 55,          // Dart (2.7.2)
      'elixir': 57,        // Elixir (1.9.4)
      'erlang': 58,        // Erlang (OTP 22.2)
      'clojure': 86,       // Clojure (1.10.1)
      'fsharp': 87,        // F# (.NET Core SDK 3.1.202)
      'fortran': 59,       // Fortran (GFortran 9.2.0)
      'assembly': 45,      // Assembly (NASM 2.14.02)
      'bash': 46,          // Bash (5.0.0)
      'basic': 47,         // Basic (FBC 1.07.1)
      'cobol': 77,         // COBOL (GnuCOBOL 2.2)
      'lisp': 55,          // Common Lisp (SBCL 2.0.0)
      'lua': 64,           // Lua (5.3.5)
      'ocaml': 65,         // OCaml (4.09.0)
      'pascal': 70,        // Pascal (FPC 3.0.4)
      'perl': 85,          // Perl (5.28.1)
      'prolog': 76,        // Prolog (GNU Prolog 1.4.5)
      'sql': 82,           // SQL (SQLite 3.27.2)
      'vb': 84,            // Visual Basic.Net (vbnc 0.0.0.5943)
    };

    // Language file extensions
    this.fileExtensions = {
      'python': '.py',
      'javascript': '.js',
      'java': '.java',
      'cpp': '.cpp',
      'csharp': '.cs',
      'go': '.go',
      'ruby': '.rb',
      'php': '.php',
      'html': '.html',
      'css': '.css',
      'c': '.c',
      'typescript': '.ts',
      'rust': '.rs',
      'swift': '.swift',
      'kotlin': '.kt',
      'scala': '.scala',
      'r': '.r',
      'dart': '.dart',
      'elixir': '.ex',
      'erlang': '.erl',
      'clojure': '.clj',
      'fsharp': '.fs',
      'fortran': '.f90',
      'assembly': '.asm',
      'bash': '.sh',
      'basic': '.bas',
      'cobol': '.cob',
      'lisp': '.lisp',
      'lua': '.lua',
      'ocaml': '.ml',
      'pascal': '.pas',
      'perl': '.pl',
      'prolog': '.pl',
      'sql': '.sql',
      'vb': '.vb'
    };

    // Default execution limits
    this.defaultLimits = {
      timeLimit: 5000,      // 5 seconds
      memoryLimit: 512000,  // 512MB
      outputLimit: 1024,    // 1KB output
      stackLimit: 128000    // 128MB stack
    };
  }

  // Get language ID from language name
  getLanguageId(language) {
    const lang = language.toLowerCase();
    return this.languageIds[lang] || this.languageIds['python'];
  }

  // Get file extension for language
  getFileExtension(language) {
    const lang = language.toLowerCase();
    return this.fileExtensions[lang] || '.txt';
  }

  // Create a submission
  async createSubmission(sourceCode, language, input = '', expectedOutput = '') {
    try {
      const languageId = this.getLanguageId(language);
      
      const submission = {
        source_code: sourceCode,
        language_id: languageId,
        stdin: input,
        expected_output: expectedOutput,
        cpu_time_limit: this.defaultLimits.timeLimit / 1000, // Convert to seconds
        memory_limit: this.defaultLimits.memoryLimit,
        enable_network: false,
        number_of_runs: 1
      };

      const response = await this.client.post('/submissions', submission);
      return {
        success: true,
        submissionId: response.data.token,
        data: response.data
      };
    } catch (error) {
      console.error('Error creating submission:', error);
      return {
        success: false,
        error: error.message || 'Failed to create submission'
      };
    }
  }

  // Get submission result
  async getSubmissionResult(submissionId) {
    try {
      const response = await this.client.get(`/submissions/${submissionId}`);
      const result = response.data;

      // Check if submission is still processing
      if (result.status && result.status.id <= 2) {
        return {
          success: true,
          status: 'processing',
          message: 'Code is still being processed'
        };
      }

      return {
        success: true,
        status: 'completed',
        data: result,
        output: result.stdout || '',
        error: result.stderr || '',
        compileOutput: result.compile_output || '',
        time: result.time,
        memory: result.memory,
        statusId: result.status?.id,
        statusDescription: result.status?.description
      };
    } catch (error) {
      console.error('Error getting submission result:', error);
      return {
        success: false,
        error: error.message || 'Failed to get submission result'
      };
    }
  }

  // Execute code with input and expected output
  async executeCode(sourceCode, language, input = '', expectedOutput = '') {
    try {
      // Create submission
      const submissionResult = await this.createSubmission(sourceCode, language, input, expectedOutput);
      
      if (!submissionResult.success) {
        return submissionResult;
      }

      const submissionId = submissionResult.submissionId;

      // Poll for result (with timeout)
      const maxAttempts = 60; // 60 seconds max (increased from 30)
      let attempts = 0;

      while (attempts < maxAttempts) {
        const result = await this.getSubmissionResult(submissionId);
        
        if (!result.success) {
          return result;
        }

        if (result.status === 'completed') {
          // Determine verdict
          const verdict = this.determineVerdict(result, expectedOutput);
          
          return {
            success: true,
            submissionId,
            verdict,
            output: result.output,
            error: result.error,
            compileOutput: result.compileOutput,
            time: result.time,
            memory: result.memory,
            statusDescription: result.statusDescription
          };
        }

        // Wait 1 second before next poll
        await new Promise(resolve => setTimeout(resolve, 1000));
        attempts++;
      }

      return {
        success: false,
        error: 'Execution timeout - submission took too long to process'
      };
    } catch (error) {
      console.error('Error executing code:', error);
      return {
        success: false,
        error: error.message || 'Failed to execute code'
      };
    }
  }

  // Determine verdict based on result and expected output
  determineVerdict(result, expectedOutput) {
    const statusId = result.statusId;

    // Check for compilation errors
    if (statusId === 4) {
      return {
        status: 'compilation_error',
        message: 'Compilation failed',
        details: result.compileOutput
      };
    }

    // Check for runtime errors
    if (statusId === 5) {
      return {
        status: 'runtime_error',
        message: 'Runtime error occurred',
        details: result.error
      };
    }

    // Check for time limit exceeded
    if (statusId === 6) {
      return {
        status: 'time_limit_exceeded',
        message: 'Time limit exceeded'
      };
    }

    // Check for memory limit exceeded
    if (statusId === 7) {
      return {
        status: 'memory_limit_exceeded',
        message: 'Memory limit exceeded'
      };
    }

    // Check for output limit exceeded
    if (statusId === 8) {
      return {
        status: 'output_limit_exceeded',
        message: 'Output limit exceeded'
      };
    }

    // Check for accepted (successful execution)
    if (statusId === 3) {
      // If expected output is provided, compare with actual output
      if (expectedOutput) {
        const normalizedOutput = this.normalizeOutput(result.output);
        const normalizedExpected = this.normalizeOutput(expectedOutput);
        
        if (normalizedOutput === normalizedExpected) {
          return {
            status: 'accepted',
            message: 'Correct output'
          };
        } else {
          return {
            status: 'wrong_answer',
            message: 'Wrong answer',
            details: {
              expected: expectedOutput,
              actual: result.output
            }
          };
        }
      } else {
        return {
          status: 'accepted',
          message: 'Code executed successfully'
        };
      }
    }

    // Other status codes
    return {
      status: 'unknown',
      message: result.statusDescription || 'Unknown status'
    };
  }

  // Normalize output for comparison (remove extra whitespace, newlines, etc.)
  normalizeOutput(output) {
    if (!output) return '';
    return output.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  // Run multiple test cases
  async runTestCases(sourceCode, language, testCases) {
    const results = [];
    
    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const result = await this.executeCode(
        sourceCode,
        language,
        testCase.input || '',
        testCase.expectedOutput || ''
      );
      
      results.push({
        testCaseIndex: i,
        testCase: testCase,
        result: result
      });
    }
    
    return results;
  }

  // Get supported languages
  async getSupportedLanguages() {
    try {
      const response = await this.client.get('/languages');
      return {
        success: true,
        languages: response.data
      };
    } catch (error) {
      console.error('Error getting supported languages:', error);
      return {
        success: false,
        error: error.message || 'Failed to get supported languages'
      };
    }
  }

  // Health check
  async healthCheck() {
    try {
      const response = await this.client.get('/languages');
      return {
        success: true,
        message: 'Judge0 service is healthy'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Judge0 service is not available'
      };
    }
  }
}

export default new Judge0Service(); 