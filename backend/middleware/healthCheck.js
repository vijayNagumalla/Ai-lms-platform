import { pool } from '../config/database.js';
import cacheService from '../config/redis.js';
import dockerCodeService from '../services/dockerCodeService.js';
import os from 'os';

// System health check
export const healthCheck = async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Check database connection
    const dbHealth = await checkDatabaseHealth();
    
    // Check Redis connection
    const redisHealth = await checkRedisHealth();
    
    // Check Docker service
    const dockerHealth = await dockerCodeService.healthCheck();
    
    // System metrics
    const systemMetrics = getSystemMetrics();
    
    // Overall health status
    const isHealthy = dbHealth.healthy && redisHealth.healthy && dockerHealth.status === 'healthy';
    
    const responseTime = Date.now() - startTime;
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      services: {
        database: dbHealth,
        redis: redisHealth,
        docker: dockerHealth
      },
      system: systemMetrics,
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      uptime: process.uptime()
    });
  }
};

// Database health check
async function checkDatabaseHealth() {
  try {
    const startTime = Date.now();
    const [result] = await pool.execute('SELECT 1 as health_check');
    const responseTime = Date.now() - startTime;
    
    return {
      healthy: true,
      responseTime: `${responseTime}ms`,
      connectionCount: pool.pool._allConnections.length,
      freeConnections: pool.pool._freeConnections.length,
      acquiringConnections: pool.pool._acquiringConnections.length
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      connectionCount: 0,
      freeConnections: 0,
      acquiringConnections: 0
    };
  }
}

// Redis health check
async function checkRedisHealth() {
  try {
    const startTime = Date.now();
    await cacheService.redis.ping();
    const responseTime = Date.now() - startTime;
    
    const info = await cacheService.info();
    const memoryUsage = info ? parseMemoryUsage(info) : null;
    
    return {
      healthy: true,
      responseTime: `${responseTime}ms`,
      memoryUsage,
      connectedClients: info?.connected_clients || 'unknown'
    };
  } catch (error) {
    return {
      healthy: false,
      error: error.message,
      responseTime: 'timeout'
    };
  }
}

// Parse Redis memory usage from info string
function parseMemoryUsage(info) {
  if (!info) return null;
  
  const lines = info.split('\n');
  const usedMemory = lines.find(line => line.startsWith('used_memory_human:'))?.split(':')[1]?.trim();
  const maxMemory = lines.find(line => line.startsWith('maxmemory_human:'))?.split(':')[1]?.trim();
  
  return {
    used: usedMemory || 'unknown',
    max: maxMemory || 'unknown'
  };
}

// System metrics
function getSystemMetrics() {
  const totalMem = os.totalmem();
  const freeMem = os.freemem();
  const usedMem = totalMem - freeMem;
  
  return {
    platform: os.platform(),
    arch: os.arch(),
    nodeVersion: process.version,
    memory: {
      total: `${Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100} GB`,
      used: `${Math.round(usedMem / 1024 / 1024 / 1024 * 100) / 100} GB`,
      free: `${Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100} GB`,
      usage: `${Math.round((usedMem / totalMem) * 100)}%`
    },
    cpu: {
      cores: os.cpus().length,
      loadAverage: os.loadavg(),
      model: os.cpus()[0]?.model || 'unknown'
    },
    uptime: {
      system: `${Math.round(os.uptime() / 3600 * 100) / 100} hours`,
      process: `${Math.round(process.uptime() / 3600 * 100) / 100} hours`
    }
  };
}

// Detailed metrics endpoint
export const getMetrics = async (req, res) => {
  try {
    const metrics = {
      timestamp: new Date().toISOString(),
      process: {
        pid: process.pid,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        version: process.version,
        platform: process.platform,
        arch: process.arch
      },
      system: getSystemMetrics(),
      database: await getDatabaseMetrics(),
      redis: await getRedisMetrics(),
      docker: dockerCodeService.getStats()
    };
    
    res.json({
      success: true,
      data: metrics
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to get metrics',
      error: error.message
    });
  }
};

// Database metrics
async function getDatabaseMetrics() {
  try {
    const [connections] = await pool.execute('SHOW STATUS LIKE "Threads_connected"');
    const [maxConnections] = await pool.execute('SHOW VARIABLES LIKE "max_connections"');
    const [slowQueries] = await pool.execute('SHOW STATUS LIKE "Slow_queries"');
    
    return {
      connections: {
        current: connections[0]?.Value || 0,
        max: maxConnections[0]?.Value || 0,
        usage: `${Math.round((connections[0]?.Value / maxConnections[0]?.Value) * 100)}%`
      },
      slowQueries: slowQueries[0]?.Value || 0,
      pool: {
        total: pool.pool._allConnections.length,
        free: pool.pool._freeConnections.length,
        acquiring: pool.pool._acquiringConnections.length
      }
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Redis metrics
async function getRedisMetrics() {
  try {
    const info = await cacheService.info();
    if (!info) return { error: 'No info available' };
    
    const lines = info.split('\n');
    const metrics = {};
    
    lines.forEach(line => {
      const [key, value] = line.split(':');
      if (key && value) {
        metrics[key.trim()] = value.trim();
      }
    });
    
    return {
      memory: {
        used: metrics.used_memory_human,
        peak: metrics.used_memory_peak_human,
        fragmentation: metrics.mem_fragmentation_ratio
      },
      clients: {
        connected: metrics.connected_clients,
        blocked: metrics.blocked_clients
      },
      stats: {
        totalCommands: metrics.total_commands_processed,
        instantaneousOps: metrics.instantaneous_ops_per_sec,
        keyspaceHits: metrics.keyspace_hits,
        keyspaceMisses: metrics.keyspace_misses
      }
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Readiness probe
export const readinessCheck = async (req, res) => {
  try {
    // Check if all critical services are ready
    const dbHealth = await checkDatabaseHealth();
    const redisHealth = await checkRedisHealth();
    
    const isReady = dbHealth.healthy && redisHealth.healthy;
    
    res.status(isReady ? 200 : 503).json({
      ready: isReady,
      timestamp: new Date().toISOString(),
      services: {
        database: dbHealth.healthy,
        redis: redisHealth.healthy
      }
    });
  } catch (error) {
    res.status(503).json({
      ready: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Liveness probe
export const livenessCheck = async (req, res) => {
  try {
    // Simple check to see if the process is alive
    res.status(200).json({
      alive: true,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      pid: process.pid
    });
  } catch (error) {
    res.status(500).json({
      alive: false,
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};
