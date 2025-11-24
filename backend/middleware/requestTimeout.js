/**
 * CRITICAL FIX: Request timeout middleware
 * Prevents long-running requests from consuming resources indefinitely
 */
export const requestTimeout = (timeoutMs = 30000) => {
  return (req, res, next) => {
    // Set timeout for the request
    req.setTimeout(timeoutMs, () => {
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout. Please try again.',
          requestId: req.requestId || 'unknown'
        });
      }
    });

    // Clear timeout on response
    const originalEnd = res.end;
    res.end = function(...args) {
      if (req.timeout) {
        clearTimeout(req.timeout);
      }
      originalEnd.apply(this, args);
    };

    next();
  };
};

