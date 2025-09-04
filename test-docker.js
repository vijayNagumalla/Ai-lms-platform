// Test script for Docker service
import DockerCodeService from './backend/services/dockerCodeService.js';

async function testDockerService() {
  console.log('Testing Docker Service...');
  
  try {
    // Test health check
    const health = await DockerCodeService.healthCheck();
    console.log('Health check:', health);
    
    // Test language config
    const pythonConfig = DockerCodeService.getLanguageConfig('python');
    console.log('Python config:', pythonConfig);
    
    const jsConfig = DockerCodeService.getLanguageConfig('javascript');
    console.log('JavaScript config:', jsConfig);
    
    // Test with undefined language
    const undefinedConfig = DockerCodeService.getLanguageConfig();
    console.log('Undefined language config:', undefinedConfig);
    
    // Test supported languages
    const supported = DockerCodeService.getSupportedLanguages();
    console.log('Supported languages:', supported);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testDockerService(); 