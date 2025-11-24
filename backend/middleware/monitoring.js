// LOW PRIORITY FIX: Monitoring and observability middleware
// Tracks metrics, request performance, and system health

import logger from '../utils/logger.js';

// In-memory metrics store (can be upgraded to Prometheus/StatsD in production)
const metrics = {
  requests: {
    total: 0,
    byMethod: {},
    byRoute: {},
    byStatus: {},
    errors: 0
  },
  responseTimes: [],
  activeConnections: 0,
  databaseQueries: {
    total: 0,
    slow: 0,
    errors: 0
  },
  memory: {
    peak: 0,
    current: 0
  }
};

// Reset metrics periodically (every hour)
setInterval(() => {
  metrics.responseTimes = metrics.responseTimes.slice(-1000); // Keep last 1000
  metrics.memory.peak = Math.max(metrics.memory.peak, metrics.memory.current);
}, 60 * 60 * 1000);

/**
 * Request monitoring middleware
 * Tracks request metrics, response times, and errors
 */
export const requestMonitoring = (req, res, next) => {
  const startTime = Date.now();
  metrics.requests.total++;
  metrics.activeConnections++;
  
  // Track by method
  const method = req.method;
  metrics.requests.byMethod[method] = (metrics.requests.byMethod[method] || 0) + 1;
  
  // Track by route
  const route = req.route?.path || req.path;
  metrics.requests.byRoute[route] = (metrics.requests.byRoute[route] || 0) + 1;
  
  // Update memory usage
  const memUsage = process.memoryUsage();
  metrics.memory.current = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  // Track response
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    metrics.activeConnections--;
    
    // Track response time
    metrics.responseTimes.push(duration);
    if (metrics.responseTimes.length > 1000) {
      metrics.responseTimes.shift();
    }
    
    // Track by status code
    const status = res.statusCode;
    const statusCategory = `${Math.floor(status / 100)}xx`;
    metrics.requests.byStatus[statusCategory] = (metrics.requests.byStatus[statusCategory] || 0) + 1;
    
    // Track errors
    if (status >= 400) {
      metrics.requests.errors++;
    }
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('Slow request detected', {
        method,
        route,
        duration: `${duration}ms`,
        status
      });
    }
  });
  
  next();
};

/**
 * Database query monitoring
 * Tracks database query performance
 */
export const trackDatabaseQuery = (query, duration, error = null) => {
  metrics.databaseQueries.total++;
  
  if (error) {
    metrics.databaseQueries.errors++;
    logger.error('Database query error', { query: query.substring(0, 200), error: error.message });
  } else if (duration > 500) {
    metrics.databaseQueries.slow++;
    logger.warn('Slow database query', { query: query.substring(0, 200), duration: `${duration}ms` });
  }
};

/**
 * Get current metrics
 */
export const getMetrics = () => {
  const responseTimes = metrics.responseTimes;
  const avgResponseTime = responseTimes.length > 0
    ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
    : 0;
  
  const p95ResponseTime = responseTimes.length > 0
    ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.95)]
    : 0;
  
  const p99ResponseTime = responseTimes.length > 0
    ? responseTimes.sort((a, b) => a - b)[Math.floor(responseTimes.length * 0.99)]
    : 0;
  
  return {
    requests: {
      ...metrics.requests,
      errorRate: metrics.requests.total > 0
        ? ((metrics.requests.errors / metrics.requests.total) * 100).toFixed(2) + '%'
        : '0%'
    },
    responseTimes: {
      average: `${avgResponseTime}ms`,
      p95: `${p95ResponseTime}ms`,
      p99: `${p99ResponseTime}ms`,
      min: responseTimes.length > 0 ? `${Math.min(...responseTimes)}ms` : '0ms',
      max: responseTimes.length > 0 ? `${Math.max(...responseTimes)}ms` : '0ms'
    },
    database: {
      ...metrics.databaseQueries,
      slowQueryRate: metrics.databaseQueries.total > 0
        ? ((metrics.databaseQueries.slow / metrics.databaseQueries.total) * 100).toFixed(2) + '%'
        : '0%',
      errorRate: metrics.databaseQueries.total > 0
        ? ((metrics.databaseQueries.errors / metrics.databaseQueries.total) * 100).toFixed(2) + '%'
        : '0%'
    },
    system: {
      activeConnections: metrics.activeConnections,
      memory: {
        current: `${metrics.memory.current}MB`,
        peak: `${metrics.memory.peak}MB`,
        usage: process.memoryUsage()
      },
      uptime: process.uptime(),
      cpu: process.cpuUsage()
    },
    timestamp: new Date().toISOString()
  };
};

/**
 * Reset metrics (for testing or manual reset)
 */
export const resetMetrics = () => {
  metrics.requests = {
    total: 0,
    byMethod: {},
    byRoute: {},
    byStatus: {},
    errors: 0
  };
  metrics.responseTimes = [];
  metrics.activeConnections = 0;
  metrics.databaseQueries = {
    total: 0,
    slow: 0,
    errors: 0
  };
  metrics.memory = {
    peak: 0,
    current: 0
  };
};

export default {
  requestMonitoring,
  trackDatabaseQuery,
  getMetrics,
  resetMetrics
};

