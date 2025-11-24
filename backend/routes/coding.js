import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { validateCSRFToken } from '../middleware/csrf.js';
import {
  executeCode,
  runTestCases,
  getSupportedLanguages,
  getLanguageTemplates,
  verifyCodingQuestion,
  healthCheck,
  getSubmissionStatus
} from '../controllers/codingController.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Execute code
router.post('/execute', validateCSRFToken, executeCode);

// Run test cases
router.post('/test-cases', validateCSRFToken, runTestCases);

// Get supported languages
router.get('/languages', getSupportedLanguages);

// Get language templates
router.get('/templates', getLanguageTemplates);

// Verify coding question
router.post('/verify', validateCSRFToken, verifyCodingQuestion);

// Health check
router.get('/health', healthCheck);

// Get submission status
router.get('/submission/:submissionId', getSubmissionStatus);

export default router; 