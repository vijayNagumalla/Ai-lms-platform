/**
 * CRITICAL FIX: Per-endpoint request size validation middleware
 * Allows different size limits for different endpoints
 */

export const requestSizeLimit = (sizeLimit = '10mb') => {
  return (req, res, next) => {
    // Get content length from headers
    const contentLength = req.get('content-length');
    
    if (!contentLength) {
      return next(); // No content length, let express handle it
    }

    // Parse size limit
    const sizeLimitBytes = parseSizeLimit(sizeLimit);
    const contentLengthNum = parseInt(contentLength, 10);

    if (isNaN(contentLengthNum)) {
      return next(); // Invalid content length, let express handle it
    }

    if (contentLengthNum > sizeLimitBytes) {
      return res.status(413).json({
        success: false,
        message: `Request entity too large. Maximum allowed size is ${sizeLimit}.`,
        requestId: req.requestId
      });
    }

    next();
  };
};

/**
 * Parse size limit string to bytes
 * Supports: '10mb', '1mb', '500kb', etc.
 */
function parseSizeLimit(sizeLimit) {
  const sizeLimitStr = String(sizeLimit).toLowerCase().trim();
  
  // Match number and unit
  const match = sizeLimitStr.match(/^(\d+)(kb|mb|gb)?$/);
  
  if (!match) {
    return 10 * 1024 * 1024; // Default to 10MB
  }

  const number = parseInt(match[1], 10);
  const unit = match[2] || 'b';

  switch (unit) {
    case 'kb':
      return number * 1024;
    case 'mb':
      return number * 1024 * 1024;
    case 'gb':
      return number * 1024 * 1024 * 1024;
    default:
      return number;
  }
}

