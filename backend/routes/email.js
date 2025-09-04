import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { checkEmailConfiguration, testEmailService } from '../controllers/emailController.js';

const router = express.Router();

// Check email configuration (Admin only)
router.get('/config', authenticateToken, checkEmailConfiguration);

// Test email service (Admin only)
router.post('/test', authenticateToken, testEmailService);

export default router; 