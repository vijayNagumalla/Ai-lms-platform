// In-memory cache service for free deployment
class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.cleanupInterval = 60 * 1000; // 1 minute
    
    // Start cleanup interval
    this.startCleanup();
  }

  // Set cache with TTL
  set(key, value, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, {
      value,
      expiresAt
    });
  }

  // Get cache value
  get(key) {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  // Delete cache entry
  delete(key) {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Cleanup expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }

  // Start automatic cleanup
  startCleanup() {
    setInterval(() => {
      this.cleanup();
    }, this.cleanupInterval);
  }

  // Cache user session
  cacheUserSession(userId, sessionData) {
    this.set(`user_session_${userId}`, sessionData, 30 * 60 * 1000); // 30 minutes
  }

  // Get user session
  getUserSession(userId) {
    return this.get(`user_session_${userId}`);
  }

  // Cache assessment data
  cacheAssessment(assessmentId, assessmentData) {
    this.set(`assessment_${assessmentId}`, assessmentData, 10 * 60 * 1000); // 10 minutes
  }

  // Get assessment data
  getAssessment(assessmentId) {
    return this.get(`assessment_${assessmentId}`);
  }

  // Cache analytics data
  cacheAnalytics(key, data) {
    this.set(`analytics_${key}`, data, 5 * 60 * 1000); // 5 minutes
  }

  // Get analytics data
  getAnalytics(key) {
    return this.get(`analytics_${key}`);
  }

  // Cache college data
  cacheCollege(collegeId, collegeData) {
    this.set(`college_${collegeId}`, collegeData, 15 * 60 * 1000); // 15 minutes
  }

  // Get college data
  getCollege(collegeId) {
    return this.get(`college_${collegeId}`);
  }

  // Cache question data
  cacheQuestions(assessmentId, questions) {
    this.set(`questions_${assessmentId}`, questions, 10 * 60 * 1000); // 10 minutes
  }

  // Get question data
  getQuestions(assessmentId) {
    return this.get(`questions_${assessmentId}`);
  }

  // Invalidate cache by pattern
  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    const now = Date.now();
    let expired = 0;
    let active = 0;
    
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        expired++;
      } else {
        active++;
      }
    }
    
    return {
      total: this.cache.size,
      active,
      expired,
      memoryUsage: process.memoryUsage()
    };
  }
}

// Create singleton instance
const cacheService = new CacheService();

export default cacheService;
