import { v4 as uuidv4 } from 'uuid';

/**
 * CRITICAL FIX: Request ID tracking middleware
 * Adds a unique request ID to each request for tracing across services
 */
export const requestTracking = (req, res, next) => {
  // Generate or use existing request ID
  req.requestId = req.headers['x-request-id'] || uuidv4();
  
  // Add request ID to response headers
  res.setHeader('X-Request-ID', req.requestId);
  
  // Add request ID to all logs (will be used by logging system)
  req.logContext = {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    ip: req.ip || req.connection.remoteAddress,
    userAgent: req.get('user-agent')
  };
  
  next();
};

