const { createClient } = require('redis');
const logger = require('./logger');

let redisClient = null;
let isRedisConnected = false;

// Bounded in-memory cache fallback using standard Map
const memoryCache = new Map();

// Periodic cleanup of expired memory cache entries
const cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [key, item] of memoryCache.entries()) {
    if (item.expiry && now > item.expiry) {
      memoryCache.delete(key);
    }
  }
}, 60000);

// Prevent the interval from keeping the Node process/test suite alive
if (cleanupInterval && typeof cleanupInterval.unref === 'function') {
  cleanupInterval.unref();
}

if (process.env.REDIS_URL) {
  redisClient = createClient({ url: process.env.REDIS_URL });

  redisClient.connect()
    .then(() => {
      isRedisConnected = true;
      logger.info('⚡ Redis connected - distributed query caching enabled');
    })
    .catch((err) => {
      logger.warn('⚠️ Redis connection failed - falling back to in-memory query cache', err);
      redisClient = null;
    });
} else {
  logger.info('ℹ️ REDIS_URL not found - using local in-memory cache fallback');
}

const get = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      const val = await redisClient.get(key);
      return val ? JSON.parse(val) : null;
    } catch (err) {
      logger.error(`Error reading from Redis key "${key}": ${err.message}`, err);
    }
  }

  // Memory Cache Lookup
  const item = memoryCache.get(key);
  if (!item) return null;

  if (item.expiry && Date.now() > item.expiry) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
};

/**
 * Set cache value with TTL in seconds
 */
const set = async (key, value, ttlSeconds = 300) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.set(key, JSON.stringify(value), {
        EX: ttlSeconds
      });
      return;
    } catch (err) {
      logger.error(`Error writing to Redis key "${key}": ${err.message}`, err);
    }
  }

  // Memory Cache Set
  const expiry = ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null;
  memoryCache.set(key, { value, expiry });
};

const del = async (key) => {
  if (isRedisConnected && redisClient) {
    try {
      await redisClient.del(key);
    } catch (err) {
      logger.error(`Error deleting Redis key "${key}": ${err.message}`, err);
    }
  }

  // Memory Cache Delete
  memoryCache.delete(key);
};

/**
 * Delete keys matching a wildcard pattern (e.g., "experts:*")
 */
const delPattern = async (pattern) => {
  if (isRedisConnected && redisClient) {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (err) {
      logger.error(`Error clearing pattern "${pattern}" in Redis: ${err.message}`, err);
    }
  }

  // Memory Cache Pattern Delete
  // Convert glob pattern to RegExp (e.g. "experts:*" -> /^experts:.*$/)
  const regexPattern = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
  for (const key of memoryCache.keys()) {
    if (regexPattern.test(key)) {
      memoryCache.delete(key);
    }
  }
};

module.exports = {
  get,
  set,
  del,
  delPattern
};
