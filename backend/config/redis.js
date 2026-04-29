const Redis = require('ioredis');

let redis = null;
let hasLoggedError = false;

const connectRedis = () => {
  try {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    
    redis = new Redis(url, {
      lazyConnect: true,
      enableOfflineQueue: false,
      maxRetriesPerRequest: 0, // Fail fast if Redis is down
      retryStrategy: (times) => {
        // Only try reconnecting a few times, then give up to stop the spam
        if (times > 3) {
          if (!hasLoggedError) {
            console.warn('⚠️ Redis connection failed multiple times. Caching remains disabled.');
            hasLoggedError = true;
          }
          return null; // stop retrying
        }
        return Math.min(times * 100, 2000);
      },
    });

    redis.on('connect', () => {
      console.log('✅ Redis connected');
      hasLoggedError = false;
    });

    redis.on('error', (err) => {
      if (!hasLoggedError) {
        console.warn('⚠️ Redis unavailable (caching disabled):', err.message);
        hasLoggedError = true;
      }
      // We don't set redis = null here anymore, let ioredis manage its state
      // but the cache middleware checks getRedis() which returns the instance.
      // We should update getRedis to return null if not connected.
    });

    return redis;
  } catch (err) {
    if (!hasLoggedError) {
      console.warn('⚠️ Redis initialization error (caching disabled)');
      hasLoggedError = true;
    }
    return null;
  }
};

const getRedis = () => {
  if (redis && redis.status === 'ready') return redis;
  return null;
};

module.exports = { connectRedis, getRedis };
