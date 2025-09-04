import cacheService from '../config/redis.js';

// Cache middleware for GET requests
export const cache = (ttl = 3600, keyGenerator = null) => {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    try {
      // Generate cache key
      const cacheKey = keyGenerator ? 
        keyGenerator(req) : 
        `cache:${req.originalUrl}:${JSON.stringify(req.query)}`;

      // Check if data exists in cache
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Cache hit for key: ${cacheKey}`);
        return res.json({
          success: true,
          data: cachedData,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      // Store original res.json function
      const originalJson = res.json;

      // Override res.json to cache the response
      res.json = function(data) {
        // Only cache successful responses
        if (data && data.success !== false) {
          cacheService.set(cacheKey, data.data || data, ttl)
            .then(() => {
              console.log(`💾 Cached response for key: ${cacheKey}`);
            })
            .catch(error => {
              console.error('Cache set error:', error);
            });
        }
        
        // Call original json function
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Cache middleware error:', error);
      next();
    }
  };
};

// Cache invalidation middleware
export const invalidateCache = (pattern) => {
  return async (req, res, next) => {
    // Store original res.json function
    const originalJson = res.json;

    // Override res.json to invalidate cache after successful operations
    res.json = function(data) {
      // Only invalidate cache for successful operations
      if (data && data.success !== false) {
        cacheService.delPattern(pattern)
          .then(() => {
            console.log(`🗑️ Invalidated cache pattern: ${pattern}`);
          })
          .catch(error => {
            console.error('Cache invalidation error:', error);
          });
      }
      
      // Call original json function
      return originalJson.call(this, data);
    };

    next();
  };
};

// User-specific cache middleware
export const userCache = (ttl = 1800) => {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !req.user) {
      return next();
    }

    try {
      const cacheKey = `user:${req.user.id}:${req.originalUrl}:${JSON.stringify(req.query)}`;
      
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ User cache hit for key: ${cacheKey}`);
        return res.json({
          success: true,
          data: cachedData,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      const originalJson = res.json;

      res.json = function(data) {
        if (data && data.success !== false) {
          cacheService.set(cacheKey, data.data || data, ttl)
            .then(() => {
              console.log(`💾 Cached user response for key: ${cacheKey}`);
            })
            .catch(error => {
              console.error('User cache set error:', error);
            });
        }
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('User cache middleware error:', error);
      next();
    }
  };
};

// Session cache middleware
export const sessionCache = {
  // Store session data
  async set(sessionId, data, ttl = 3600) {
    return await cacheService.set(`session:${sessionId}`, data, ttl);
  },

  // Get session data
  async get(sessionId) {
    return await cacheService.get(`session:${sessionId}`);
  },

  // Delete session data
  async del(sessionId) {
    return await cacheService.del(`session:${sessionId}`);
  },

  // Update session TTL
  async refresh(sessionId, ttl = 3600) {
    return await cacheService.expire(`session:${sessionId}`, ttl);
  }
};

// API response cache with smart invalidation
export const smartCache = (ttl = 3600) => {
  return async (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    try {
      const cacheKey = `smart:${req.originalUrl}:${JSON.stringify(req.query)}`;
      
      const cachedData = await cacheService.get(cacheKey);
      
      if (cachedData) {
        console.log(`✅ Smart cache hit for key: ${cacheKey}`);
        return res.json({
          success: true,
          data: cachedData,
          cached: true,
          timestamp: new Date().toISOString()
        });
      }

      const originalJson = res.json;

      res.json = function(data) {
        if (data && data.success !== false) {
          // Cache with shorter TTL for frequently changing data
          const smartTTL = req.originalUrl.includes('/analytics') ? 300 : ttl;
          
          cacheService.set(cacheKey, data.data || data, smartTTL)
            .then(() => {
              console.log(`💾 Smart cached response for key: ${cacheKey}`);
            })
            .catch(error => {
              console.error('Smart cache set error:', error);
            });
        }
        
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.error('Smart cache middleware error:', error);
      next();
    }
  };
};

// Cache statistics
export const getCacheStats = async () => {
  try {
    const info = await cacheService.info();
    return {
      connected: true,
      info: info ? info.split('\n').reduce((acc, line) => {
        const [key, value] = line.split(':');
        if (key && value) {
          acc[key.trim()] = value.trim();
        }
        return acc;
      }, {}) : {}
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
};
