// CRITICAL FIX: Middleware to enforce HTTPS for sensitive endpoints (proctoring, etc.)
// This ensures proctoring data is transmitted over encrypted connections

export const requireHTTPS = (req, res, next) => {
  // Skip in development
  if (process.env.NODE_ENV === 'development') {
    return next();
  }
  
  // Check if request is secure (HTTPS)
  const isSecure = req.secure || 
                   req.headers['x-forwarded-proto'] === 'https' ||
                   req.protocol === 'https';
  
  if (!isSecure) {
    return res.status(403).json({
      success: false,
      message: 'HTTPS is required for this endpoint. Please use a secure connection.',
      error: 'INSECURE_CONNECTION'
    });
  }
  
  // CRITICAL FIX: Verify TLS version if available
  const tlsVersion = req.connection?.getCipher()?.version || 
                     req.socket?.getCipher()?.version;
  
  if (tlsVersion && tlsVersion.startsWith('TLSv1.0')) {
    console.warn(`⚠️ WARNING: Insecure TLS version detected: ${tlsVersion}`);
    // Don't block, but log warning
  }
  
  next();
};

