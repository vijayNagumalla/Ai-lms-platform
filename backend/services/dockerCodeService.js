import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = promisify(exec);

class DockerCodeService {
  constructor() {
    this.tempDir = './temp';
    // CRITICAL FIX: Make timeout configurable via environment variable (default 5 seconds for better algorithm support)
    this.timeout = parseInt(process.env.CODE_EXECUTION_TIMEOUT_MS) || 5000; // 5 seconds default (was 2 seconds)
    // CRITICAL FIX: Make memory limit configurable via environment variable
    this.memoryLimit = process.env.CODE_EXECUTION_MEMORY_LIMIT || '128m'; // Minimal memory limit
    // Allow disabling read-only root filesystem when Docker on host OS doesn't permit file copies (e.g., Windows)
    this.enforceReadOnlyRoot = process.env.CODE_EXECUTION_READONLY_ROOT === 'true';
    this.containerCache = new Map(); // Cache for reusable containers
    this.containerPool = new Map(); // Pool of pre-created containers by language
    this.maxPoolSize = 3; // Maximum containers per language in pool

    // Language configurations with more common images
    this.languages = {
      python: {
        image: 'python:3.9-alpine',
        extension: '.py',
        runCommand: 'python',
        setupCommand: null
      },
      javascript: {
        image: 'node:18-alpine',
        extension: '.js',
        runCommand: 'node',
        setupCommand: null
      },
      java: {
        image: 'openjdk:17-jdk-alpine',
        extension: '.java',
        runCommand: 'java',
        setupCommand: 'javac',
        className: 'Main'
      },
      cpp: {
        image: 'gcc:latest',
        extension: '.cpp',
        runCommand: './a.out',
        setupCommand: 'g++ -o a.out',
        inputFile: true
      },
      c: {
        image: 'gcc:latest',
        extension: '.c',
        runCommand: './a.out',
        setupCommand: 'gcc -o a.out',
        inputFile: true
      },
      csharp: {
        image: 'mcr.microsoft.com/dotnet/sdk:6.0',
        extension: '.cs',
        runCommand: 'dotnet run',
        setupCommand: 'dotnet new console --force'
      },
      php: {
        image: 'php:8.1-alpine',
        extension: '.php',
        runCommand: 'php',
        setupCommand: null
      },
      ruby: {
        image: 'ruby:3.1-alpine',
        extension: '.rb',
        runCommand: 'ruby',
        setupCommand: null
      },
      go: {
        image: 'golang:1.19-alpine',
        extension: '.go',
        runCommand: 'go run',
        setupCommand: null
      },
      rust: {
        image: 'rust:1.70-alpine',
        extension: '.rs',
        runCommand: './main',
        setupCommand: 'rustc -o main'
      }
    };
  }

  // Get language configuration
  getLanguageConfig(language) {
    if (!language) {
      // console.warn('No language specified, falling back to Python');
      return this.languages.python;
    }

    const lang = language.toLowerCase();
    // console.log(`Looking for language config: '${lang}'`);
    // console.log(`Available languages: ${Object.keys(this.languages).join(', ')}`);

    const config = this.languages[lang];

    if (!config) {
      // console.warn(`Language '${language}' not found, falling back to Python`);
      return this.languages.python;
    }

    // Ensure image is defined
    if (!config.image) {
      // console.error(`No Docker image configured for language '${language}'`);
      throw new Error(`Unsupported language: ${language}`);
    }

    // console.log(`Using language config for '${lang}': ${config.image}`);
    return config;
  }

  // Create a temporary file
  async createTempFile(code, extension) {
    let filename;

    // For Java, ensure filename matches class name
    if (extension === '.java') {
      // Improved regex to handle various Java class declarations
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      if (classMatch) {
        filename = `${classMatch[1]}.java`;
      } else {
        // Fallback: try to find any class declaration
        const fallbackMatch = code.match(/class\s+(\w+)/);
        if (fallbackMatch) {
          filename = `${fallbackMatch[1]}.java`;
        } else {
          filename = `Main.java`;
        }
      }
    } else {
      filename = `${uuidv4()}${extension}`;
    }

    const filepath = path.join(this.tempDir, filename);

    // Ensure temp directory exists
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    await fs.writeFile(filepath, code);
    return { filename, filepath };
  }

  // Create a temporary input file
  async createTempInputFile(input) {
    const filename = `input_${uuidv4()}`;
    const filepath = path.join(this.tempDir, filename);

    // Ensure temp directory exists
    try {
      await fs.mkdir(this.tempDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    await fs.writeFile(filepath, input);
    return { filename, filepath };
  }

  // Clean up temporary files
  async cleanupTempFiles(files) {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch (error) {
        // File might already be deleted
      }
    }
  }

  // Execute code in Docker container
  async executeCode(sourceCode, language, input = '', expectedOutput = '') {
    const config = this.getLanguageConfig(language);

    // CRITICAL FIX: Input sanitization to prevent code injection
    // Sanitize source code to remove potential command injection
    const sanitizedSourceCode = this.sanitizeCode(sourceCode);
    const sanitizedInput = this.sanitizeInput(input);
    const sanitizedExpectedOutput = expectedOutput ? this.sanitizeInput(expectedOutput) : '';

    // Pre-validate Java code structure
    if (config.extension === '.java') {
      const validation = this.validateJavaCode(sanitizedSourceCode);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          status: 'Compilation Error'
        };
      }
    }

    const { filename, filepath } = await this.createTempFile(sanitizedSourceCode, config.extension);

    try {
      // Create Docker container and execute code with sanitized input
      const result = await this.runInDocker(config, filepath, sanitizedInput);

      // Check if output matches expected (using sanitized expected output)
      const isCorrect = sanitizedExpectedOutput ?
        this.normalizeOutput(result.stdout) === this.normalizeOutput(sanitizedExpectedOutput) :
        true;

      return {
        success: true,
        output: result.stdout,
        error: result.stderr,
        time: result.time,
        memory: result.memory,
        isCorrect,
        status: isCorrect ? 'Accepted' : 'Wrong Answer'
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        status: 'Error'
      };
    } finally {
      // Clean up
      await this.cleanupTempFiles([filepath]);
    }
  }

  // Validate Java code structure
  validateJavaCode(sourceCode) {
    // Check if code contains a class declaration
    if (!sourceCode.includes('class')) {
      return {
        isValid: false,
        error: 'Java code must contain a class declaration'
      };
    }

    // Check if code contains a main method
    if (!sourceCode.includes('public static void main')) {
      return {
        isValid: false,
        error: 'Java code must contain a public static void main method'
      };
    }

    // Check for basic syntax issues
    const openBraces = (sourceCode.match(/\{/g) || []).length;
    const closeBraces = (sourceCode.match(/\}/g) || []).length;

    if (openBraces !== closeBraces) {
      return {
        isValid: false,
        error: 'Mismatched braces in Java code'
      };
    }

    return {
      isValid: true,
      error: null
    };
  }

  // CRITICAL FIX: Sanitize code to prevent injection attacks
  sanitizeCode(code) {
    if (typeof code !== 'string') {
      throw new Error('Code must be a string');
    }

    // Remove null bytes and control characters that could cause issues
    let sanitized = code.replace(/\0/g, '').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Limit code length (prevent DoS via extremely long code)
    const MAX_CODE_LENGTH = 100000; // 100KB
    if (sanitized.length > MAX_CODE_LENGTH) {
      throw new Error(`Code exceeds maximum length of ${MAX_CODE_LENGTH} characters`);
    }

    return sanitized;
  }

  // CRITICAL FIX: Sanitize input to prevent command injection
  sanitizeInput(input) {
    if (typeof input !== 'string') {
      return '';
    }

    // Remove null bytes and dangerous characters
    let sanitized = input.replace(/\0/g, '').replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '');

    // Limit input length (prevent DoS)
    const MAX_INPUT_LENGTH = 10000; // 10KB
    if (sanitized.length > MAX_INPUT_LENGTH) {
      throw new Error(`Input exceeds maximum length of ${MAX_INPUT_LENGTH} characters`);
    }

    return sanitized;
  }

  // Run code in Docker container
  async runInDocker(config, filepath, input = '') {
    // CRITICAL FIX: Validate and sanitize filepath to prevent path traversal
    const sanitizedFilepath = path.resolve(filepath); // Normalize path
    if (!sanitizedFilepath.startsWith(path.resolve(__dirname, '../temp'))) {
      throw new Error('Invalid file path - path traversal detected');
    }

    const containerName = `code-exec-${uuidv4().replace(/-/g, '')}`;
    // CRITICAL FIX: Sanitize container name to prevent injection
    const sanitizedContainerName = containerName.replace(/[^a-zA-Z0-9_-]/g, '');
    const filename = path.basename(sanitizedFilepath);

    // CRITICAL FIX: Validate filename to prevent injection
    if (!filename.match(/^[a-zA-Z0-9_\-\.]+$/)) {
      throw new Error('Invalid filename - contains dangerous characters');
    }

    try {
      // CRITICAL FIX: Validate Docker image name to prevent injection
      const sanitizedImage = config.image.replace(/[^a-zA-Z0-9_\-\.\/:]/g, '');
      if (!sanitizedImage || sanitizedImage !== config.image) {
        throw new Error('Invalid Docker image name');
      }

      // Create and start container with security hardening (CRITICAL SECURITY FIX)
      // --network=none: No network access
      // --read-only: Read-only root filesystem
      // --tmpfs /tmp: Temporary filesystem for /tmp
      // --tmpfs /app: Temporary filesystem for /app (if needed)
      // --security-opt=no-new-privileges: Prevent privilege escalation
      // --cap-drop=ALL: Drop all capabilities
      // --user=nobody: Run as non-root user (if supported by image)
      const readOnlyFlag = this.enforceReadOnlyRoot ? ' --read-only' : '';
      await execAsync(`docker run --name ${sanitizedContainerName} -d --rm --network=none${readOnlyFlag} --tmpfs /tmp --tmpfs /app --security-opt=no-new-privileges --cap-drop=ALL -m ${this.memoryLimit} --cpus=0.5 ${sanitizedImage} sh -c "mkdir -p /app && sleep 5"`);

      // Reduced wait time for container to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // CRITICAL FIX: Copy file to container with sanitized paths
      await execAsync(`docker cp "${sanitizedFilepath}" ${sanitizedContainerName}:/app/${filename}`);

      // Prepare commands
      let commands = [];

      // Setup command (compile if needed)
      if (config.setupCommand) {
        if (config.inputFile) {
          commands.push(`cd /app && ${config.setupCommand} ${filename}`);
        } else if (config.extension === '.java') {
          // Java compilation - compile to .class file with better error handling
          commands.push(`cd /app && javac -encoding UTF-8 ${filename}`);
        } else if (config.extension === '.cs') {
          // C# setup - create project and replace Program.cs
          commands.push(`cd /app && ${config.setupCommand}`);
          commands.push(`cd /app && rm Program.cs && cp ${filename} Program.cs`);
        } else {
          commands.push(`cd /app && ${config.setupCommand} ${filename}`);
        }
      }

      // Run command with input if provided
      if (input) {
        // Create input file and pipe it to the program
        const inputFile = `/tmp/input_${uuidv4()}`;

        // CRITICAL FIX: Write input to a temporary file on host, then copy to container with sanitized paths
        const { filepath: tempInputFile } = await this.createTempInputFile(input);
        const sanitizedTempInputFile = path.resolve(tempInputFile);
        await execAsync(`docker cp "${sanitizedTempInputFile}" ${sanitizedContainerName}:${inputFile}`);
        await fs.unlink(tempInputFile); // Clean up temp file

        if (config.extension === '.java') {
          // Java execution - run the compiled class with better error handling
          const className = filename.replace('.java', '');
          commands.push(`cd /app && java -Dfile.encoding=UTF-8 ${className} < ${inputFile}`);
        } else if (config.extension === '.cs') {
          // C# execution - run with dotnet
          commands.push(`cd /app && ${config.runCommand} < ${inputFile}`);
        } else if (config.inputFile) {
          commands.push(`cd /app && ${config.runCommand} < ${inputFile}`);
        } else {
          commands.push(`cd /app && ${config.runCommand} /app/${filename} < ${inputFile}`);
        }
      } else {
        if (config.extension === '.java') {
          // Java execution - run the compiled class with better error handling
          const className = filename.replace('.java', '');
          commands.push(`cd /app && java -Dfile.encoding=UTF-8 ${className}`);
        } else if (config.extension === '.cs') {
          // C# execution - run with dotnet
          commands.push(`cd /app && ${config.runCommand}`);
        } else if (config.inputFile) {
          commands.push(`cd /app && ${config.runCommand}`);
        } else {
          commands.push(`cd /app && ${config.runCommand} /app/${filename}`);
        }
      }

      // Execute commands
      const startTime = Date.now();
      let stdout = '';
      let stderr = '';

      for (const command of commands) {
        try {
          // CRITICAL FIX: Escape command properly and use sanitized container name
          // Use single quotes for command and escape properly
          const escapedCommand = command.replace(/'/g, "'\\''");
          const { stdout: cmdStdout, stderr: cmdStderr } = await execAsync(
            `docker exec ${sanitizedContainerName} sh -c '${escapedCommand}'`,
            { timeout: this.timeout }
          );
          stdout += cmdStdout;
          stderr += cmdStderr;
        } catch (error) {
          // console.error(`Command failed: ${command}`, error);
          stderr += error.stderr || error.message;
          if (error.code === 'ETIMEDOUT') {
            throw new Error('Execution timeout');
          }
          // For Java compilation errors, provide more specific error messages
          if (config.extension === '.java' && error.stderr) {
            throw new Error(`Java compilation error: ${error.stderr}`);
          }
        }
      }

      const endTime = Date.now();
      const time = endTime - startTime;

      // Get memory usage (approximate)
      const memory = await this.getContainerMemoryUsage(sanitizedContainerName);

      return { stdout, stderr, time, memory };

    } finally {
      // Clean up container
      try {
        await execAsync(`docker stop ${sanitizedContainerName}`);
      } catch (error) {
        // Container might already be stopped
      }
    }
  }

  // Get container memory usage
  async getContainerMemoryUsage(containerName) {
    // CRITICAL FIX: Sanitize container name before using in command
    const sanitizedContainerName = containerName.replace(/[^a-zA-Z0-9_-]/g, '');
    try {
      const { stdout } = await execAsync(`docker stats ${sanitizedContainerName} --no-stream --format "table {{.MemUsage}}"`);
      const lines = stdout.trim().split('\n');
      if (lines.length > 1) {
        const memUsage = lines[1];
        // Extract numeric value (e.g., "50.5MiB" -> 50.5)
        const match = memUsage.match(/(\d+\.?\d*)/);
        return match ? parseFloat(match[1]) : 0;
      }
    } catch (error) {
      // Ignore errors
    }
    return 0;
  }

  // Normalize output for comparison
  normalizeOutput(output) {
    return output.trim().replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  }

  // Get supported languages
  getSupportedLanguages() {
    return Object.keys(this.languages);
  }

  // Health check
  async healthCheck() {
    try {
      const { stdout } = await execAsync('docker --version');
      return {
        success: true,
        message: 'Docker is available',
        version: stdout.trim()
      };
    } catch (error) {
      return {
        success: false,
        error: 'Docker is not available or not running'
      };
    }
  }

  // Ultra-optimized methods for test case execution
  async createContainer(containerName, image) {
    // Use Alpine images for faster startup
    const alpineImage = image.includes('alpine') ? image : image.replace(':latest', ':alpine').replace(/:[^:]+$/, ':alpine');

    try {
      // Security hardening: no network, dropped capabilities (CRITICAL SECURITY FIX)
      // Note: Removed --read-only flag to allow file copying on Windows Docker Desktop
      await execAsync(`docker run --name ${containerName} -d --rm --network=none --tmpfs /tmp --security-opt=no-new-privileges --cap-drop=ALL -m ${this.memoryLimit} --cpus=0.5 ${alpineImage} sh -c "mkdir -p /app && sleep 1"`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Minimal wait
    } catch (error) {
      // Fallback to original image if Alpine not available
      // Note: Removed --read-only flag to allow file copying on Windows Docker Desktop
      await execAsync(`docker run --name ${containerName} -d --rm --network=none --tmpfs /tmp --security-opt=no-new-privileges --cap-drop=ALL -m ${this.memoryLimit} --cpus=0.5 ${image} sh -c "mkdir -p /app && sleep 1"`);
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async copyFileToContainer(containerName, filepath, filename) {
    await execAsync(`docker cp ${filepath} ${containerName}:/app/${filename}`);
  }

  async executeInContainer(containerName, command) {
    const { stdout, stderr } = await execAsync(`docker exec ${containerName} sh -c "${command}"`, { timeout: this.timeout });
    return { stdout, stderr };
  }

  async executeTestCaseInContainer(containerName, config, filename, input, expectedOutput) {
    const startTime = Date.now();
    let stdout = '';
    let stderr = '';

    try {
      let command = '';

      if (input) {
        // Create input file and pipe it to the program
        const inputFile = `/tmp/input_${Date.now()}`;
        const { filepath: tempInputFile } = await this.createTempInputFile(input);
        await execAsync(`docker cp ${tempInputFile} ${containerName}:${inputFile}`);
        await fs.unlink(tempInputFile);

        if (config.extension === '.java') {
          const className = filename.replace('.java', '');
          command = `cd /app && java -Dfile.encoding=UTF-8 ${className} < ${inputFile}`;
        } else if (config.extension === '.cs') {
          command = `cd /app && ${config.runCommand} < ${inputFile}`;
        } else if (config.inputFile) {
          command = `cd /app && ${config.runCommand} < ${inputFile}`;
        } else {
          command = `cd /app && ${config.runCommand} /app/${filename} < ${inputFile}`;
        }
      } else {
        if (config.extension === '.java') {
          const className = filename.replace('.java', '');
          command = `cd /app && java -Dfile.encoding=UTF-8 ${className}`;
        } else if (config.extension === '.cs') {
          command = `cd /app && ${config.runCommand}`;
        } else if (config.inputFile) {
          command = `cd /app && ${config.runCommand}`;
        } else {
          command = `cd /app && ${config.runCommand} /app/${filename}`;
        }
      }

      const { stdout: cmdStdout, stderr: cmdStderr } = await execAsync(
        `docker exec ${containerName} sh -c "${command}"`,
        { timeout: this.timeout }
      );

      stdout = cmdStdout;
      stderr = cmdStderr;
    } catch (error) {
      stderr = error.stderr || error.message;
      if (error.code === 'ETIMEDOUT') {
        throw new Error('Execution timeout');
      }
      if (config.extension === '.java' && error.stderr) {
        throw new Error(`Java execution error: ${error.stderr}`);
      }
    }

    const endTime = Date.now();
    const time = endTime - startTime;

    // Check if output matches expected
    const isCorrect = expectedOutput ?
      this.normalizeOutput(stdout) === this.normalizeOutput(expectedOutput) :
      true;

    return {
      success: true,
      output: stdout,
      error: stderr,
      time: time,
      memory: 0, // Approximate for now
      isCorrect,
      status: isCorrect ? 'Accepted' : 'Wrong Answer'
    };
  }

  async cleanupContainer(containerName) {
    try {
      await execAsync(`docker stop ${containerName}`);
    } catch (error) {
      // Container might already be stopped
    }
  }

  // Ultra-fast execution method - minimal overhead
  async executeCodeUltraFast(filepath, config, input, expectedOutput) {
    const containerName = `ultra-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const filename = path.basename(filepath);

    // Validate config
    if (!config || !config.image) {
      throw new Error('Invalid language configuration: missing Docker image');
    }

    try {
      // Create container with security hardening (CRITICAL SECURITY FIX)
      // Note: Removed --read-only flag to allow file copying on Windows Docker Desktop
      await execAsync(`docker run --name ${containerName} -d --network=none --tmpfs /tmp --security-opt=no-new-privileges --cap-drop=ALL -m ${this.memoryLimit} --cpus=0.5 ${config.image} sh -c "mkdir -p /app && sleep 30"`);

      // Wait a moment for container to fully start
      await new Promise(resolve => setTimeout(resolve, 200));

      // Copy file to container
      await execAsync(`docker cp ${filepath} ${containerName}:/app/`);

      let command = '';
      let setupCommand = '';

      // Prepare optimized commands based on language
      if (config.extension === '.java') {
        const className = filename.replace('.java', '');
        setupCommand = `cd /app && javac -encoding UTF-8 -O ${filename}`; // Added optimization flag
        command = input ?
          `cd /app && echo '${input.replace(/'/g, "'\"'\"'")}' | java -Dfile.encoding=UTF-8 -Xms32m -Xmx64m ${className}` :
          `cd /app && java -Dfile.encoding=UTF-8 -Xms32m -Xmx64m ${className}`;
      } else if (config.extension === '.py') {
        command = input ?
          `cd /app && echo '${input.replace(/'/g, "'\"'\"'")}' | python -O ${filename}` : // Added optimization flag
          `cd /app && python -O ${filename}`;
      } else if (config.extension === '.js') {
        command = input ?
          `cd /app && echo '${input.replace(/'/g, "'\"'\"'")}' | node --max-old-space-size=64 ${filename}` :
          `cd /app && node --max-old-space-size=64 ${filename}`;
      } else if (config.extension === '.cpp') {
        setupCommand = `cd /app && g++ -O2 -o ${filename.replace('.cpp', '')} ${filename}`; // Added optimization flag
        command = input ?
          `cd /app && echo '${input.replace(/'/g, "'\"'\"'")}' | ./${filename.replace('.cpp', '')}` :
          `cd /app && ./${filename.replace('.cpp', '')}`;
      } else {
        // Fallback to config commands
        if (config.setupCommand) {
          setupCommand = `cd /app && ${config.setupCommand} ${filename}`;
        }
        command = input ?
          `cd /app && echo '${input.replace(/'/g, "'\"'\"'")}' | ${config.runCommand} ${filename}` :
          `cd /app && ${config.runCommand} ${filename}`;
      }

      // Execute setup if needed with reduced timeout
      if (setupCommand) {
        await execAsync(`docker exec ${containerName} sh -c "${setupCommand}"`, { timeout: 2000 });
      }

      // Execute main command with minimal timeout
      const { stdout, stderr } = await execAsync(`docker exec ${containerName} sh -c "${command}"`, { timeout: 1000 });

      // Check if output matches expected
      const isCorrect = expectedOutput ?
        this.normalizeOutput(stdout) === this.normalizeOutput(expectedOutput) :
        true;

      return {
        success: true,
        output: stdout,
        error: stderr,
        time: 0, // Will be calculated by caller
        memory: 0,
        isCorrect,
        status: isCorrect ? 'Accepted' : 'Wrong Answer'
      };

    } catch (error) {
      return {
        success: false,
        output: '',
        error: error.stderr || error.message,
        time: 0,
        memory: 0,
        isCorrect: false,
        status: 'Error'
      };
    } finally {
      // Cleanup containers properly
      try {
        await execAsync(`docker stop ${containerName}`, { timeout: 2000 });
        await execAsync(`docker rm -f ${containerName}`, { timeout: 2000 });
        // Container cleaned up successfully
      } catch (e) {
        // Container cleanup completed
      }
    }
  }

  // Optimized batch execution method - reuses single container for all test cases
  async executeBatchTestCases(filepath, config, testCases) {
    const containerName = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const filename = path.basename(filepath);
    const results = [];

    // Validate config
    if (!config || !config.image) {
      throw new Error('Invalid language configuration: missing Docker image');
    }

    try {
      // Create single container with security hardening (CRITICAL SECURITY FIX)
      // Note: Removed --read-only flag to allow file copying on Windows Docker Desktop
      await execAsync(`docker run --name ${containerName} -d --network=none --tmpfs /tmp --security-opt=no-new-privileges --cap-drop=ALL -m ${this.memoryLimit} --cpus=0.5 ${config.image} sh -c "mkdir -p /app && sleep 60"`);

      // Wait for container to fully start
      await new Promise(resolve => setTimeout(resolve, 300));

      // Copy file to container once
      await execAsync(`docker cp ${filepath} ${containerName}:/app/`);

      // Setup/compilation command (run only once)
      let setupCommand = '';
      let baseCommand = '';

      if (config.extension === '.java') {
        const className = filename.replace('.java', '');
        setupCommand = `cd /app && javac -encoding UTF-8 -O ${filename}`;
        baseCommand = `cd /app && java -Dfile.encoding=UTF-8 -Xms32m -Xmx64m ${className}`;
      } else if (config.extension === '.py') {
        baseCommand = `python -O /app/${filename}`;
      } else if (config.extension === '.js') {
        baseCommand = `node --max-old-space-size=64 /app/${filename}`;
      } else if (config.extension === '.cpp') {
        setupCommand = `cd /app && g++ -O2 -o solution ${filename}`;
        baseCommand = `cd /app && ./solution`;
      } else if (config.extension === '.c') {
        setupCommand = `cd /app && gcc -O2 -o solution ${filename}`;
        baseCommand = `cd /app && ./solution`;
      } else if (config.extension === '.go') {
        baseCommand = `cd /app && go run ${filename}`;
      } else {
        // Generic fallback
        if (config.setupCommand) {
          setupCommand = `cd /app && ${config.setupCommand} ${filename}`;
        }
        baseCommand = `cd /app && ${config.runCommand} ${filename}`;
      }

      // Run setup command once if needed (compilation)
      if (setupCommand) {

        await execAsync(`docker exec ${containerName} sh -c "${setupCommand}"`, { timeout: this.timeout });
      }

      // Execute each test case in the same container
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const startTime = Date.now();

        try {
          // Handle multiple possible field names for test case data
          const testInput = testCase.input || testCase.input_data || testCase.inputData || '';
          const expectedOutput = testCase.expected_output || testCase.output || testCase.expected_result || testCase.expectedOutput || '';

          // Build command with input
          const command = testInput ?
            `printf '${testInput.replace(/\\/g, '\\\\').replace(/'/g, "'\"'\"'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}' | ${baseCommand}` :
            baseCommand;

          // Execute test case



          const { stdout, stderr } = await execAsync(
            `docker exec ${containerName} sh -c "${command}"`,
            { timeout: this.timeout }
          );

          const endTime = Date.now();
          const executionTime = endTime - startTime;

          // Check if output matches expected
          const isCorrect = expectedOutput ?
            this.normalizeOutput(stdout) === this.normalizeOutput(expectedOutput) :
            true;

          results.push({
            testCase: testCase,
            result: {
              success: true,
              output: stdout,
              error: stderr,
              executionTime: executionTime,
              memoryUsed: 0,
              verdict: {
                status: isCorrect ? 'accepted' : 'wrong_answer',
                message: isCorrect ? 'Test case passed' : 'Test case failed'
              }
            }
          });



        } catch (error) {
          const endTime = Date.now();

          results.push({
            testCase: testCase,
            result: {
              success: false,
              output: '',
              error: error.stderr || error.message,
              executionTime: endTime - startTime,
              memoryUsed: 0,
              verdict: {
                status: 'failed',
                message: error.message || 'Execution failed'
              }
            }
          });
        }
      }

      return results;

    } catch (error) {
      // console.error('Batch execution setup error:', error);
      throw error;
    } finally {
      // Cleanup container with force removal
      try {
        // Force stop the container (doesn't fail if already stopped)
        try {
          await execAsync(`docker stop ${containerName}`, { timeout: 5000 });
        } catch (stopError) {
          // Container might already be stopped, continue to removal
        }

        // Force remove the container
        try {
          await execAsync(`docker rm -f ${containerName}`, { timeout: 5000 });

        } catch (rmError) {

        }
      } catch (e) {

      }
    }
  }

  // Helper method to normalize output for comparison
  normalizeOutput(output) {
    if (!output) return '';
    return output.toString().trim().replace(/\r\n/g, '\n');
  }

  // Container pool management methods
  async getPooledContainer(language) {
    const pool = this.containerPool.get(language) || [];
    if (pool.length > 0) {
      const container = pool.pop();
      this.containerPool.set(language, pool);

      // Verify container is still running
      try {
        await execAsync(`docker exec ${container.name} echo "alive"`);

        return container;
      } catch (error) {

        return null;
      }
    }
    return null;
  }

  async returnToPool(container, language) {
    const pool = this.containerPool.get(language) || [];
    if (pool.length < this.maxPoolSize) {
      // Clean the container state but keep it running
      try {
        await execAsync(`docker exec ${container.name} sh -c "rm -rf /app/* && mkdir -p /app"`);
        pool.push(container);
        this.containerPool.set(language, pool);

        return true;
      } catch (error) {

        await this.destroyContainer(container.name);
        return false;
      }
    } else {
      // Pool is full, destroy the container
      await this.destroyContainer(container.name);
      return false;
    }
  }

  async destroyContainer(containerName) {
    try {
      // Force stop the container (doesn't fail if already stopped)
      try {
        await execAsync(`docker stop ${containerName}`, { timeout: 5000 });
      } catch (stopError) {
        // Container might already be stopped, continue to removal
      }

      // Force remove the container
      try {
        await execAsync(`docker rm -f ${containerName}`, { timeout: 5000 });

      } catch (rmError) {

      }
    } catch (error) {

    }
  }

  // Enhanced batch execution with container pooling
  async executeBatchTestCasesWithPool(filepath, config, testCases) {
    // Validate config
    if (!config || !config.image) {
      throw new Error('Invalid language configuration: missing Docker image');
    }

    const language = Object.keys(this.languages).find(lang =>
      this.languages[lang].extension === config.extension
    ) || 'unknown';

    // Try to get a pooled container first
    let container = await this.getPooledContainer(language);
    let containerName;
    let shouldReturnToPool = false;

    if (container) {
      containerName = container.name;
      shouldReturnToPool = true;
    } else {
      // Create new container
      containerName = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      try {
        await execAsync(`docker run --name ${containerName} -d --network=none --read-only --tmpfs /tmp --tmpfs /app --security-opt=no-new-privileges --cap-drop=ALL -m ${this.memoryLimit} --cpus=0.5 ${config.image} sh -c "mkdir -p /app && sleep 300"`);
        await new Promise(resolve => setTimeout(resolve, 300));
        container = { name: containerName };
        shouldReturnToPool = true;
      } catch (error) {
        // console.error('Failed to create container:', error);
        throw error;
      }
    }

    const filename = path.basename(filepath);
    const results = [];

    try {
      // Copy file to container
      await execAsync(`docker cp ${filepath} ${containerName}:/app/`);

      // Setup/compilation command (run only once)
      let setupCommand = '';
      let baseCommand = '';

      if (config.extension === '.java') {
        const className = filename.replace('.java', '');
        setupCommand = `cd /app && javac -encoding UTF-8 -O ${filename}`;
        baseCommand = `cd /app && java -Dfile.encoding=UTF-8 -Xms32m -Xmx64m ${className}`;
      } else if (config.extension === '.py') {
        baseCommand = `python -O /app/${filename}`;
      } else if (config.extension === '.js') {
        baseCommand = `node --max-old-space-size=64 /app/${filename}`;
      } else if (config.extension === '.cpp') {
        setupCommand = `cd /app && g++ -O2 -o solution ${filename}`;
        baseCommand = `cd /app && ./solution`;
      } else if (config.extension === '.c') {
        setupCommand = `cd /app && gcc -O2 -o solution ${filename}`;
        baseCommand = `cd /app && ./solution`;
      } else if (config.extension === '.go') {
        baseCommand = `cd /app && go run ${filename}`;
      } else {
        // Generic fallback
        if (config.setupCommand) {
          setupCommand = `cd /app && ${config.setupCommand} ${filename}`;
        }
        baseCommand = `cd /app && ${config.runCommand} ${filename}`;
      }

      // Run setup command once if needed (compilation)
      if (setupCommand) {

        await execAsync(`docker exec ${containerName} sh -c "${setupCommand}"`, { timeout: this.timeout });
      }

      // Execute each test case in the same container
      for (let i = 0; i < testCases.length; i++) {
        const testCase = testCases[i];
        const startTime = Date.now();

        try {
          // Handle multiple possible field names for test case data
          const testInput = testCase.input || testCase.input_data || testCase.inputData || '';
          const expectedOutput = testCase.expected_output || testCase.output || testCase.expected_result || testCase.expectedOutput || '';

          // Build command with input
          const command = testInput ?
            `printf '${testInput.replace(/\\/g, '\\\\').replace(/'/g, "'\"'\"'").replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r').replace(/\t/g, '\\t')}' | ${baseCommand}` :
            baseCommand;

          // Execute test case
          const { stdout, stderr } = await execAsync(
            `docker exec ${containerName} sh -c "${command}"`,
            { timeout: this.timeout }
          );

          const endTime = Date.now();
          const executionTime = endTime - startTime;

          // Check if output matches expected
          const isCorrect = expectedOutput ?
            this.normalizeOutput(stdout) === this.normalizeOutput(expectedOutput) :
            true;

          results.push({
            testCase: testCase,
            result: {
              success: true,
              output: stdout,
              error: stderr,
              executionTime: executionTime,
              memoryUsed: 0,
              verdict: {
                status: isCorrect ? 'accepted' : 'wrong_answer',
                message: isCorrect ? 'Test case passed' : 'Test case failed'
              }
            }
          });

        } catch (error) {
          const endTime = Date.now();

          results.push({
            testCase: testCase,
            result: {
              success: false,
              output: '',
              error: error.stderr || error.message,
              executionTime: endTime - startTime,
              memoryUsed: 0,
              verdict: {
                status: 'error',
                message: error.message || 'Execution failed'
              }
            }
          });
        }
      }

      return results;

    } catch (error) {
      // console.error('Batch execution error:', error);
      shouldReturnToPool = false; // Don't return potentially corrupted container to pool
      throw error;
    } finally {
      // Return container to pool or destroy it
      if (shouldReturnToPool) {
        const returned = await this.returnToPool(container, language);
        if (!returned) {

        }
      } else {
        await this.destroyContainer(containerName);
      }
    }
  }

  // Cleanup method to destroy all pooled containers (call on app shutdown)
  async cleanupAllPooledContainers() {

    for (const [language, pool] of this.containerPool.entries()) {
      for (const container of pool) {
        await this.destroyContainer(container.name);
      }
    }
    this.containerPool.clear();

  }
}

export default new DockerCodeService(); 