import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const execAsync = promisify(exec);

class DockerCodeService {
  constructor() {
    this.tempDir = './temp';
    this.timeout = parseInt(process.env.DOCKER_TIMEOUT) || 5000; // 5 seconds for better reliability
    this.memoryLimit = process.env.DOCKER_MEMORY_LIMIT || '256m'; // Increased memory limit
    this.containerCache = new Map(); // Cache for reusable containers
    this.containerPool = new Map(); // Pool of pre-created containers by language
    this.maxPoolSize = parseInt(process.env.DOCKER_MAX_POOL_SIZE) || 10; // Increased pool size
    this.maxConcurrentExecutions = parseInt(process.env.DOCKER_MAX_CONCURRENT) || 50; // Max concurrent executions
    this.activeExecutions = 0; // Track active executions
    this.executionQueue = []; // Queue for executions when at capacity
    this.cleanupInterval = setInterval(() => this.cleanupContainers(), 300000); // 5 minutes
    this.stats = {
      totalExecutions: 0,
      successfulExecutions: 0,
      failedExecutions: 0,
      averageExecutionTime: 0
    };
    
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
      console.warn('No language specified, falling back to Python');
      return this.languages.python;
    }
    
    const lang = language.toLowerCase();
    console.log(`Looking for language config: '${lang}'`);
    console.log(`Available languages: ${Object.keys(this.languages).join(', ')}`);
    
    const config = this.languages[lang];
    
    if (!config) {
      console.warn(`Language '${language}' not found, falling back to Python`);
      return this.languages.python;
    }
    
    // Ensure image is defined
    if (!config.image) {
      console.error(`No Docker image configured for language '${language}'`);
      throw new Error(`Unsupported language: ${language}`);
    }
    
    console.log(`Using language config for '${lang}': ${config.image}`);
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
    
    // Pre-validate Java code structure
    if (config.extension === '.java') {
      const validation = this.validateJavaCode(sourceCode);
      if (!validation.isValid) {
        return {
          success: false,
          error: validation.error,
          status: 'Compilation Error'
        };
      }
    }
    
    const { filename, filepath } = await this.createTempFile(sourceCode, config.extension);
    
    try {
      // Create Docker container and execute code
      const result = await this.runInDocker(config, filepath, input);
      
      // Check if output matches expected
      const isCorrect = expectedOutput ? 
        this.normalizeOutput(result.stdout) === this.normalizeOutput(expectedOutput) : 
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

  // Run code in Docker container
  async runInDocker(config, filepath, input = '') {
    const containerName = `code-exec-${uuidv4().replace(/-/g, '')}`;
    const filename = path.basename(filepath);
    
    try {
      // Create and start container with /app directory - optimized for speed
      await execAsync(`docker run --name ${containerName} -d --rm -m ${this.memoryLimit} ${config.image} sh -c "mkdir -p /app && sleep 5"`);
      
      // Reduced wait time for container to be ready
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Copy file to container
      await execAsync(`docker cp ${filepath} ${containerName}:/app/${filename}`);
      
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
        
        // Write input to a temporary file on host, then copy to container
        const { filepath: tempInputFile } = await this.createTempInputFile(input);
        await execAsync(`docker cp ${tempInputFile} ${containerName}:${inputFile}`);
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
          const { stdout: cmdStdout, stderr: cmdStderr } = await execAsync(
            `docker exec ${containerName} sh -c "${command}"`,
            { timeout: this.timeout }
          );
          stdout += cmdStdout;
          stderr += cmdStderr;
        } catch (error) {
          console.error(`Command failed: ${command}`, error);
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
      const memory = await this.getContainerMemoryUsage(containerName);
      
      return { stdout, stderr, time, memory };
      
    } finally {
      // Clean up container
      try {
        await execAsync(`docker stop ${containerName}`);
      } catch (error) {
        // Container might already be stopped
      }
    }
  }

  // Get container memory usage
  async getContainerMemoryUsage(containerName) {
    try {
      const { stdout } = await execAsync(`docker stats ${containerName} --no-stream --format "table {{.MemUsage}}"`);
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

  // Queue management for concurrent executions
  async queueExecution(executionFn) {
    return new Promise((resolve, reject) => {
      const execution = {
        fn: executionFn,
        resolve,
        reject,
        timestamp: Date.now()
      };

      if (this.activeExecutions < this.maxConcurrentExecutions) {
        this.executeQueued(execution);
      } else {
        this.executionQueue.push(execution);
      }
    });
  }

  async executeQueued(execution) {
    this.activeExecutions++;
    const startTime = Date.now();

    try {
      const result = await execution.fn();
      this.stats.successfulExecutions++;
      this.stats.totalExecutions++;
      this.updateAverageExecutionTime(Date.now() - startTime);
      execution.resolve(result);
    } catch (error) {
      this.stats.failedExecutions++;
      this.stats.totalExecutions++;
      execution.reject(error);
    } finally {
      this.activeExecutions--;
      
      // Process next in queue
      if (this.executionQueue.length > 0) {
        const nextExecution = this.executionQueue.shift();
        this.executeQueued(nextExecution);
      }
    }
  }

  updateAverageExecutionTime(executionTime) {
    const total = this.stats.totalExecutions;
    this.stats.averageExecutionTime = 
      (this.stats.averageExecutionTime * (total - 1) + executionTime) / total;
  }

  // Cleanup inactive containers
  async cleanupContainers() {
    try {
      const now = Date.now();
      const maxAge = 10 * 60 * 1000; // 10 minutes

      for (const [language, containers] of this.containerPool.entries()) {
        const activeContainers = [];
        
        for (const container of containers) {
          if (now - container.lastUsed < maxAge) {
            activeContainers.push(container);
          } else {
            try {
              await this.stopContainer(container.name);
            } catch (error) {
              console.error(`Error stopping container ${container.name}:`, error);
            }
          }
        }
        
        this.containerPool.set(language, activeContainers);
      }
    } catch (error) {
      console.error('Container cleanup error:', error);
    }
  }

  // Get service statistics
  getStats() {
    return {
      ...this.stats,
      activeExecutions: this.activeExecutions,
      queueLength: this.executionQueue.length,
      poolSizes: Object.fromEntries(
        Array.from(this.containerPool.entries()).map(([lang, containers]) => [lang, containers.length])
      )
    };
  }

  // Health check
  async healthCheck() {
    try {
      // Check if Docker is running
      await execAsync('docker ps');
      
      // Check container pool status
      const poolStatus = Array.from(this.containerPool.entries()).map(([lang, containers]) => ({
        language: lang,
        count: containers.length,
        maxSize: this.maxPoolSize
      }));

      return {
        status: 'healthy',
        docker: 'running',
        activeExecutions: this.activeExecutions,
        maxConcurrent: this.maxConcurrentExecutions,
        queueLength: this.executionQueue.length,
        poolStatus,
        stats: this.stats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        stats: this.stats
      };
    }
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
      await execAsync(`docker run --name ${containerName} -d --rm -m ${this.memoryLimit} ${alpineImage} sh -c "mkdir -p /app && sleep 1"`);
      await new Promise(resolve => setTimeout(resolve, 100)); // Minimal wait
    } catch (error) {
      // Fallback to original image if Alpine not available
      await execAsync(`docker run --name ${containerName} -d --rm -m ${this.memoryLimit} ${image} sh -c "mkdir -p /app && sleep 1"`);
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
      // Create container with sleep to keep it alive and create /app directory
      await execAsync(`docker run --name ${containerName} -d -m ${this.memoryLimit} --cpus=0.5 ${config.image} sh -c "mkdir -p /app && sleep 30"`);
      
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
      // Create single container for all test cases
      await execAsync(`docker run --name ${containerName} -d -m ${this.memoryLimit} --cpus=0.5 ${config.image} sh -c "mkdir -p /app && sleep 60"`);
      
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
      console.error('Batch execution setup error:', error);
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
        await execAsync(`docker run --name ${containerName} -d -m ${this.memoryLimit} --cpus=0.5 ${config.image} sh -c "mkdir -p /app && sleep 300"`);
        await new Promise(resolve => setTimeout(resolve, 300));
        container = { name: containerName };
        shouldReturnToPool = true;
      } catch (error) {
        console.error('Failed to create container:', error);
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
      console.error('Batch execution error:', error);
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