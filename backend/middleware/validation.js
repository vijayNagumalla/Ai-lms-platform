import { body, param, query, validationResult } from 'express-validator';

// CRITICAL FIX: Validation error handler middleware
export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(err => ({
        field: err.param || err.path,
        message: err.msg,
        value: err.value
      }))
    });
  }
  next();
};

// CRITICAL FIX: Common validation rules
export const commonValidations = {
  // Email validation
  email: body('email')
    .trim()
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  // Password validation
  password: body('password')
    .trim()
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/[A-Z]/)
    .withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/)
    .withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/)
    .withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage('Password must contain at least one special character'),

  // Name validation
  name: body('name')
    .trim()
    .isLength({ min: 1, max: 255 })
    .withMessage('Name must be between 1 and 255 characters')
    .escape(),

  // UUID validation
  uuid: param('id')
    .isUUID()
    .withMessage('Invalid ID format'),

  // Integer validation
  integer: query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  // Limit validation
  limit: query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
};

// CRITICAL FIX: Sanitization middleware for XSS prevention
export const sanitizeInput = (req, res, next) => {
  // Sanitize string inputs recursively
  const sanitize = (obj) => {
    if (typeof obj === 'string') {
      // Remove potentially dangerous characters
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .trim();
    }
    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }
    if (obj && typeof obj === 'object') {
      const sanitized = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }
    return obj;
  };

  // Sanitize request body, query, and params
  if (req.body) {
    req.body = sanitize(req.body);
  }
  if (req.query) {
    req.query = sanitize(req.query);
  }
  if (req.params) {
    req.params = sanitize(req.params);
  }

  next();
};

// CRITICAL FIX: Authentication validation rules
export const authValidations = {
  register: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.name,
    body('role')
      .isIn(['student', 'faculty', 'college-admin', 'super-admin'])
      .withMessage('Invalid role specified'),
    handleValidationErrors
  ],

  login: [
    commonValidations.email,
    body('password')
      .trim()
      .notEmpty()
      .withMessage('Password is required'),
    handleValidationErrors
  ],

  changePassword: [
    body('currentPassword')
      .trim()
      .notEmpty()
      .withMessage('Current password is required'),
    commonValidations.password,
    handleValidationErrors
  ],

  forgotPassword: [
    commonValidations.email,
    handleValidationErrors
  ],

  resetPassword: [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('Reset token is required'),
    commonValidations.password,
    handleValidationErrors
  ],

  verifyEmail: [
    body('token')
      .trim()
      .notEmpty()
      .withMessage('Verification token is required'),
    handleValidationErrors
  ]
};

// CRITICAL FIX: User management validation rules
export const userValidations = {
  createUser: [
    commonValidations.email,
    commonValidations.password,
    commonValidations.name,
    body('role')
      .isIn(['student', 'faculty', 'college-admin'])
      .withMessage('Invalid role specified'),
    handleValidationErrors
  ],

  updateUser: [
    param('userId').isUUID().withMessage('Invalid user ID'),
    body('email').optional().isEmail().withMessage('Invalid email address'),
    body('name').optional().trim().isLength({ min: 1, max: 255 }),
    handleValidationErrors
  ],

  getUserById: [
    param('userId').isUUID().withMessage('Invalid user ID'),
    handleValidationErrors
  ]
};

// CRITICAL FIX: Assessment validation rules
export const assessmentValidations = {
  createAssessment: [
    body('title')
      .trim()
      .isLength({ min: 1, max: 255 })
      .withMessage('Assessment title must be between 1 and 255 characters'),
    body('time_limit_minutes')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Time limit must be a positive integer'),
    body('total_points')
      .optional()
      .isInt({ min: 0 })
      .withMessage('Total points must be a non-negative integer'),
    handleValidationErrors
  ],

  getAssessmentById: [
    param('assessmentId').isUUID().withMessage('Invalid assessment ID'),
    handleValidationErrors
  ]
};

