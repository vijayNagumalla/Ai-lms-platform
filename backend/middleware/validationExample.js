// MEDIUM PRIORITY FIX: Example validation middleware using express-validator
// This demonstrates how to add consistent validation across all routes
// Copy and adapt this pattern to other route files

import { body, param, query, validationResult } from 'express-validator';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Example: Assessment ID validation
export const validateAssessmentId = [
  param('assessmentId')
    .notEmpty()
    .withMessage('Assessment ID is required')
    .isString()
    .withMessage('Assessment ID must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('Assessment ID must be between 1 and 50 characters'),
  validate
];

// Example: User ID validation
export const validateUserId = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isString()
    .withMessage('User ID must be a string')
    .isLength({ min: 1, max: 50 })
    .withMessage('User ID must be between 1 and 50 characters'),
  validate
];

// Example: Pagination validation
export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  validate
];

// Example: Date range validation
export const validateDateRange = [
  query('dateFrom')
    .optional()
    .isISO8601()
    .withMessage('dateFrom must be a valid ISO 8601 date'),
  query('dateTo')
    .optional()
    .isISO8601()
    .withMessage('dateTo must be a valid ISO 8601 date')
    .custom((value, { req }) => {
      if (req.query.dateFrom && value < req.query.dateFrom) {
        throw new Error('dateTo must be greater than or equal to dateFrom');
      }
      return true;
    }),
  validate
];

// Example: Assessment creation validation
export const validateAssessmentCreation = [
  body('title')
    .notEmpty()
    .withMessage('Title is required')
    .isString()
    .withMessage('Title must be a string')
    .isLength({ min: 1, max: 255 })
    .withMessage('Title must be between 1 and 255 characters'),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .isLength({ max: 2000 })
    .withMessage('Description must not exceed 2000 characters'),
  body('time_limit_minutes')
    .optional()
    .isInt({ min: 1, max: 1440 })
    .withMessage('Time limit must be between 1 and 1440 minutes'),
  body('total_points')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total points must be a non-negative number'),
  validate
];

// Example: Email validation
export const validateEmail = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Email must be a valid email address')
    .normalizeEmail(),
  validate
];

// Example: Password validation
export const validatePassword = [
  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>])/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  validate
];

