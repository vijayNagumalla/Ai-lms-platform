import express from 'express';
import rateLimit from 'express-rate-limit';
import { authenticateToken } from '../middleware/auth.js';
import { generateCSRFToken, validateCSRFToken } from '../middleware/csrf.js';
import { sanitizeInput } from '../middleware/validation.js';
import { authValidations } from '../middleware/validation.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  logout,
  verifyEmail,
  resendVerificationEmail,
  requestPasswordReset,
  resetPasswordWithToken
} from '../controllers/authController.js';

const router = express.Router();

// Rate limiting configuration - more lenient in development
const isDevelopment = process.env.NODE_ENV === 'development';
const AUTH_RATE_LIMIT = parseInt(process.env.AUTH_RATE_LIMIT) || (isDevelopment ? 50 : 5);
const LOGIN_RATE_LIMIT = parseInt(process.env.LOGIN_RATE_LIMIT) || (isDevelopment ? 50 : 5);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (15 * 60 * 1000); // 15 minutes

// Rate limiting for authentication endpoints (CRITICAL SECURITY FIX)
const authLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: AUTH_RATE_LIMIT,
  message: {
    success: false,
    message: `Too many authentication attempts, please try again after ${Math.round(RATE_LIMIT_WINDOW / 60000)} minutes`
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false, // Count successful requests too
  skipFailedRequests: false
});

// Stricter rate limiting for login (prevent brute force)
const loginLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW,
  max: LOGIN_RATE_LIMIT,
  message: {
    success: false,
    message: `Too many login attempts, please try again after ${Math.round(RATE_LIMIT_WINDOW / 60000)} minutes`
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
  skipFailedRequests: false
});

// CRITICAL FIX: Input sanitization for all routes
router.use(sanitizeInput);

// Public routes with rate limiting and validation
router.post('/register', authLimiter, ...authValidations.register, register);
router.post('/login', loginLimiter, ...authValidations.login, login);

// CRITICAL FIX: Email verification and password reset routes with validation
// Support both GET (for direct email links) and POST (for API calls)
router.get('/verify-email', authLimiter, verifyEmail);
router.post('/verify-email', authLimiter, ...authValidations.verifyEmail, verifyEmail);
router.post('/resend-verification', authLimiter, ...authValidations.forgotPassword, resendVerificationEmail);
router.post('/forgot-password', authLimiter, ...authValidations.forgotPassword, requestPasswordReset);
router.post('/reset-password', authLimiter, ...authValidations.resetPassword, resetPasswordWithToken);
router.post('/logout', logout);

// CSRF token endpoint (must be authenticated)
router.get('/csrf-token', authenticateToken, generateCSRFToken, (req, res) => {
  res.json({
    success: true,
    csrfToken: req.csrfToken || req.headers['x-csrf-token']
  });
});

// Protected routes with CSRF protection and validation
router.get('/profile', authenticateToken, getProfile);
router.put('/profile', authenticateToken, validateCSRFToken, updateProfile);
router.put('/change-password', authenticateToken, validateCSRFToken, ...authValidations.changePassword, changePassword);

export default router; 