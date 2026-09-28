const { createClient } = require('redis');
const logger = require('../shared/utils/logger');

let redisClient;

const connectRedis = async () => {
  try {
    redisClient = createClient({
      socket: {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
      },
      password: process.env.REDIS_PASSWORD || undefined,
    });

    redisClient.on('error', (err) => logger.error('Redis error:', err));
    redisClient.on('connect', () => logger.info('✅ Redis connected'));

    await redisClient.connect();
  } catch (error) {
    logger.error('❌ Redis connection failed:', error.message);
    throw error;
  }
};

const getRedis = () => {
  return redisClient || null;
};

module.exports = { connectRedis, getRedis };
