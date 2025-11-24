/**
 * LOW PRIORITY FIX: Standardized error handling middleware
 * Provides consistent error responses across the application
 */

import logger from '../utils/logger.js';
import { createErrorResponse, getStatusCode } from '../utils/errorCodes.js';

export const errorHandler = (err, req, res, next) => {
  // Log error with request context
  const errorContext = {
    requestId: req.requestId || 'unknown',
    method: req.method,
    path: req.path,
    error: {
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      name: err.name
    }
  };

  logger.logError(err, errorContext);

  // Don't send response if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // LOW PRIORITY FIX: Use standardized error codes
  let errorCode = 'SERVER_INTERNAL_ERROR';
  let statusCode = 500;
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorCode = 'VALIDATION_INVALID_INPUT';
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError' || err.status === 401) {
    errorCode = 'AUTH_REQUIRED';
    statusCode = 401;
  } else if (err.name === 'ForbiddenError' || err.status === 403) {
    errorCode = 'AUTH_INSUFFICIENT_PERMISSIONS';
    statusCode = 403;
  } else if (err.name === 'NotFoundError' || err.status === 404) {
    errorCode = 'RESOURCE_NOT_FOUND';
    statusCode = 404;
  } else if (err.code === 'ER_DUP_ENTRY') {
    errorCode = 'RESOURCE_ALREADY_EXISTS';
    statusCode = 409;
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2') {
    errorCode = 'VALIDATION_INVALID_INPUT';
    statusCode = 400;
  } else {
    statusCode = err.status || err.statusCode || 500;
  }

  // Use standardized error response
  const errorResponse = createErrorResponse(errorCode, {
    requestId: req.requestId,
    ...(process.env.NODE_ENV === 'development' && { 
      originalError: err.message,
      stack: err.stack 
    })
  });

  res.status(statusCode).json(errorResponse);
};

