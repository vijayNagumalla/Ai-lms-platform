import Redis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

// Redis configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT) || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  db: parseInt(process.env.REDIS_DB) || 0,
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keepAlive: 30000,
  // Connection pool settings
  family: 4, // 4 (IPv4) or 6 (IPv6)
  connectTimeout: 10000,
  commandTimeout: 5000,
  // Retry settings
  retryDelayOnClusterDown: 300,
  retryDelayOnFailover: 100,
  maxRetriesPerRequest: 3,
  // Memory optimization
  maxMemoryPolicy: 'allkeys-lru',
  // Cluster settings (if using Redis Cluster)
  enableOfflineQueue: false,
  // SSL settings
  tls: process.env.REDIS_TLS === 'true' ? {} : undefined
};

// Create Redis client
const redis = new Redis(redisConfig);

// Redis connection event handlers
redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('✅ Redis ready to accept commands');
});

redis.on('error', (error) => {
  console.error('❌ Redis connection error:', error);
});

redis.on('close', () => {
  console.log('⚠️ Redis connection closed');
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis reconnecting...');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🔄 Closing Redis connection...');
  await redis.quit();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('🔄 Closing Redis connection...');
  await redis.quit();
  process.exit(0);
});

// Cache utility functions
export class CacheService {
  constructor() {
    this.redis = redis;
    this.defaultTTL = 3600; // 1 hour
  }

  // Set cache with TTL
  async set(key, value, ttl = this.defaultTTL) {
    try {
      const serializedValue = JSON.stringify(value);
      await this.redis.setex(key, ttl, serializedValue);
      return true;
    } catch (error) {
      console.error('Cache set error:', error);
      return false;
    }
  }

  // Get cache
  async get(key) {
    try {
      const value = await this.redis.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Delete cache
  async del(key) {
    try {
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Cache delete error:', error);
      return false;
    }
  }

  // Delete multiple keys
  async delPattern(pattern) {
    try {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
      return true;
    } catch (error) {
      console.error('Cache delete pattern error:', error);
      return false;
    }
  }

  // Check if key exists
  async exists(key) {
    try {
      const result = await this.redis.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Cache exists error:', error);
      return false;
    }
  }

  // Set cache with hash
  async hset(key, field, value, ttl = this.defaultTTL) {
    try {
      await this.redis.hset(key, field, JSON.stringify(value));
      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Cache hset error:', error);
      return false;
    }
  }

  // Get cache from hash
  async hget(key, field) {
    try {
      const value = await this.redis.hget(key, field);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Cache hget error:', error);
      return null;
    }
  }

  // Get all fields from hash
  async hgetall(key) {
    try {
      const hash = await this.redis.hgetall(key);
      const result = {};
      for (const [field, value] of Object.entries(hash)) {
        result[field] = JSON.parse(value);
      }
      return result;
    } catch (error) {
      console.error('Cache hgetall error:', error);
      return {};
    }
  }

  // Increment counter
  async incr(key, ttl = this.defaultTTL) {
    try {
      const result = await this.redis.incr(key);
      await this.redis.expire(key, ttl);
      return result;
    } catch (error) {
      console.error('Cache incr error:', error);
      return 0;
    }
  }

  // Set expiration
  async expire(key, ttl) {
    try {
      await this.redis.expire(key, ttl);
      return true;
    } catch (error) {
      console.error('Cache expire error:', error);
      return false;
    }
  }

  // Get TTL
  async ttl(key) {
    try {
      return await this.redis.ttl(key);
    } catch (error) {
      console.error('Cache ttl error:', error);
      return -1;
    }
  }

  // Flush all cache
  async flushall() {
    try {
      await this.redis.flushall();
      return true;
    } catch (error) {
      console.error('Cache flushall error:', error);
      return false;
    }
  }

  // Get Redis info
  async info() {
    try {
      return await this.redis.info();
    } catch (error) {
      console.error('Cache info error:', error);
      return null;
    }
  }
}

// Create cache service instance
export const cacheService = new CacheService();

// Export Redis client for direct use if needed
export { redis };
export default cacheService;
