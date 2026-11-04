const { createClient } = require('redis');
const logger = require('../shared/utils/logger');

let redisClient = null;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT, 10) || 6379,
        reconnectStrategy: (retries) => {
          if (retries > 3) {
            logger.warn('⚠️ Redis connection retry limit reached. Continuing without cache (MongoDB fallback).');
            return false; // Stop auto-reconnecting to prevent process blockage
          }
          return Math.min(retries * 500, 2000);
        },
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', (err) => {
      logger.warn(`Redis connection warning: ${err.message}`);
    });

    redisClient.on('connect', () => logger.info('🔄 Redis connecting...'));
    redisClient.on('ready', () => logger.info('✅ Redis connected and ready'));

    await redisClient.connect();
    return redisClient;
  } catch (error) {
    logger.warn(`⚠️ Redis is unavailable: ${error.message}. App will fallback to MongoDB directly.`);
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

