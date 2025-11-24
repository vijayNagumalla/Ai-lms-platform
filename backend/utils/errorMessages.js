/**
 * LOW FIX: Standardized error messages
 * Provides consistent, user-friendly error messages across the application
 */

export const ErrorMessages = {
  // Authentication & Authorization
  AUTH_REQUIRED: 'Please log in to access this resource.',
  AUTH_INVALID_TOKEN: 'Your session has expired. Please log in again.',
  AUTH_INSUFFICIENT_PERMISSIONS: 'You do not have permission to perform this action.',
  
  // Validation
  VALIDATION_INVALID_INPUT: 'The provided information is invalid. Please check your input and try again.',
  VALIDATION_MISSING_REQUIRED: 'Please fill in all required fields.',
  VALIDATION_INVALID_FORMAT: 'The data format is incorrect. Please check and try again.',
  
  // Resources
  RESOURCE_NOT_FOUND: 'The requested resource could not be found.',
  RESOURCE_ALREADY_EXISTS: 'This resource already exists.',
  RESOURCE_CONFLICT: 'A conflict occurred with this resource.',
  
  // Assessment specific
  ASSESSMENT_NOT_FOUND: 'Assessment not found.',
  ASSESSMENT_NOT_AVAILABLE: 'This assessment is not currently available.',
  ASSESSMENT_TIME_EXPIRED: 'The time limit for this assessment has expired.',
  ASSESSMENT_ALREADY_SUBMITTED: 'This assessment has already been submitted.',
  ASSESSMENT_MAX_ATTEMPTS: 'You have reached the maximum number of attempts for this assessment.',
  
  // Submission specific
  SUBMISSION_NOT_FOUND: 'Submission not found.',
  SUBMISSION_INVALID_STATE: 'This submission is in an invalid state for this operation.',
  SUBMISSION_ALREADY_EXISTS: 'A submission for this assessment already exists.',
  
  // Answer specific
  ANSWER_SAVE_FAILED: 'Failed to save your answer. Please try again.',
  ANSWER_INVALID: 'The provided answer is invalid.',
  
  // Server errors
  SERVER_ERROR: 'An internal server error occurred. Please try again later.',
  DATABASE_ERROR: 'A database error occurred. Please try again later.',
  NETWORK_ERROR: 'A network error occurred. Please check your connection and try again.',
  
  // Generic
  OPERATION_FAILED: 'The operation failed. Please try again.',
  UNEXPECTED_ERROR: 'An unexpected error occurred. Please contact support if the problem persists.',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED: 'Too many requests. Please wait a moment and try again.',
  
  // Proctoring
  PROCTORING_REQUIRED: 'Proctoring is required for this assessment.',
  PROCTORING_SETUP_FAILED: 'Failed to set up proctoring. Please check your camera and microphone permissions.',
  
  // Export
  EXPORT_FAILED: 'Failed to generate export. Please try again.',
  EXPORT_NOT_FOUND: 'Export file not found.',
  
  // Analytics
  ANALYTICS_UNAVAILABLE: 'Analytics data is currently unavailable. Please try again later.',
  ANALYTICS_INSUFFICIENT_DATA: 'Insufficient data available for analytics.',
};

/**
 * Get user-friendly error message
 * @param {string} errorCode - Error code key
 * @param {string} fallback - Fallback message if code not found
 * @returns {string} User-friendly error message
 */
export function getUserFriendlyMessage(errorCode, fallback = ErrorMessages.UNEXPECTED_ERROR) {
  return ErrorMessages[errorCode] || fallback;
}

/**
 * Sanitize error message for production
 * Removes internal details and stack traces
 * @param {Error|string} error - Error object or message
 * @param {boolean} isDevelopment - Whether in development mode
 * @returns {string} Sanitized error message
 */
export function sanitizeErrorMessage(error, isDevelopment = false) {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    // In development, show full error
    if (isDevelopment) {
      return error.message;
    }
    
    // In production, return generic message for internal errors
    if (error.message.includes('ECONNREFUSED') || error.message.includes('ETIMEDOUT')) {
      return ErrorMessages.NETWORK_ERROR;
    }
    
    if (error.message.includes('database') || error.message.includes('SQL')) {
      return ErrorMessages.DATABASE_ERROR;
    }
    
    // Return user-friendly message if available, otherwise generic
    return error.message || ErrorMessages.UNEXPECTED_ERROR;
  }
  
  return ErrorMessages.UNEXPECTED_ERROR;
}

export default ErrorMessages;

