const { createClient } = require('redis');
const logger = require('../shared/utils/logger');

let redisClient = null;

const connectRedis = async () => {
  if (process.env.REDIS_ENABLED === 'false') {
    logger.info('ℹ️ Redis is disabled (REDIS_ENABLED=false). Running in direct MongoDB mode.');
    return null;
  }

  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        connectTimeout: 1500,
        reconnectStrategy: false, // Fail fast in dev if Redis is not running
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', () => {
      // Silent error handler to avoid spamming console when offline
    });

    redisClient.on('connect', () => logger.info('🔄 Redis connecting...'));
    redisClient.on('ready', () => logger.info('✅ Redis connected and ready'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.warn(`⚠️ Redis is unavailable (${error.message || 'connection refused'}). App will fallback to MongoDB directly.`);
    redisClient = null;
    return null;
  }
};

const getRedis = () => {
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }
  return null;
};

const disconnectRedis = async () => {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
      logger.info('Redis disconnected gracefully');
    } catch (err) {
      logger.error('Error disconnecting Redis:', err);
    }
  }
};

module.exports = { connectRedis, getRedis, disconnectRedis };

