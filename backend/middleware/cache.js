const { getRedis } = require('../config/redis');

// Cache middleware - caches GET responses in Redis
const cacheMiddleware = (duration) => async (req, res, next) => {
  const redis = getRedis();
  if (!redis) return next(); // skip if Redis unavailable

  const key = `cache:${req.originalUrl}`;

  try {
    const cached = await redis.get(key);
    if (cached) {
      res.set('X-Cache', 'HIT');
      return res.json(JSON.parse(cached));
    }

    res.set('X-Cache', 'MISS');

    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = (data) => {
      redis.setex(key, duration, JSON.stringify(data)).catch(() => {});
      return originalJson(data);
    };

    next();
  } catch (err) {
    next();
  }
};

// Invalidate cache by pattern
const invalidateCache = async (pattern) => {
  const redis = getRedis();
  if (!redis) return;
  try {
    const keys = await redis.keys(`cache:${pattern}*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch {}
};

module.exports = { cacheMiddleware, invalidateCache };
