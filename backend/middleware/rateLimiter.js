import rateLimit from 'express-rate-limit';
import { pool } from '../config/database.js';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.round(15 * 60 * 1000 / 1000) // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.round(15 * 60 * 1000 / 1000)
    });
  }
});

// Strict rate limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login attempts per windowMs
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
    retryAfter: Math.round(15 * 60 * 1000 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Too many authentication attempts, please try again later.',
      retryAfter: Math.round(15 * 60 * 1000 / 1000)
    });
  }
});

// Code execution rate limiter
export const codeExecutionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // Limit each IP to 30 code executions per minute
  message: {
    success: false,
    message: 'Code execution rate limit exceeded, please wait before trying again.',
    retryAfter: Math.round(1 * 60 * 1000 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Code execution rate limit exceeded, please wait before trying again.',
      retryAfter: Math.round(1 * 60 * 1000 / 1000)
    });
  }
});

// Assessment submission rate limiter
export const assessmentLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // Limit each IP to 20 assessment submissions per 5 minutes
  message: {
    success: false,
    message: 'Assessment submission rate limit exceeded, please wait before trying again.',
    retryAfter: Math.round(5 * 60 * 1000 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'Assessment submission rate limit exceeded, please wait before trying again.',
      retryAfter: Math.round(5 * 60 * 1000 / 1000)
    });
  }
});

// File upload rate limiter
export const uploadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 50, // Limit each IP to 50 file uploads per 10 minutes
  message: {
    success: false,
    message: 'File upload rate limit exceeded, please wait before trying again.',
    retryAfter: Math.round(10 * 60 * 1000 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: 'File upload rate limit exceeded, please wait before trying again.',
      retryAfter: Math.round(10 * 60 * 1000 / 1000)
    });
  }
});

// Dynamic rate limiter based on user role
export const createRoleBasedLimiter = (baseLimit, multiplier = 1) => {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: async (req) => {
      try {
        // Get user role from token if available
        const authHeader = req.headers['authorization'];
        if (!authHeader) return baseLimit;
        
        const token = authHeader.split(' ')[1];
        if (!token) return baseLimit;
        
        // Decode JWT to get user role (without verification for rate limiting)
        const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
        
        // Get user role from database
        const [users] = await pool.execute(
          'SELECT role FROM users WHERE id = ? AND is_active = TRUE',
          [decoded.userId]
        );
        
        if (users.length === 0) return baseLimit;
        
        const role = users[0].role;
        
        // Different limits based on role
        switch (role) {
          case 'super-admin':
            return baseLimit * 10; // 10x limit for super admin
          case 'college-admin':
            return baseLimit * 5; // 5x limit for college admin
          case 'faculty':
            return baseLimit * 3; // 3x limit for faculty
          case 'student':
            return baseLimit; // Base limit for students
          default:
            return baseLimit;
        }
      } catch (error) {
        return baseLimit; // Fallback to base limit on error
      }
    },
    message: {
      success: false,
      message: 'Rate limit exceeded for your role, please try again later.',
      retryAfter: Math.round(15 * 60 * 1000 / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false
  });
};

// Export role-based limiters
export const roleBasedLimiter = createRoleBasedLimiter(100);
export const roleBasedStrictLimiter = createRoleBasedLimiter(50);
