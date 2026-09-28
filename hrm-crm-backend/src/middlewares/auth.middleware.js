const jwt = require('jsonwebtoken');
const { AppError } = require('./error.middleware');
const { getRedis } = require('../config/redis');

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Access token required', 401);
    }

    const token = authHeader.split(' ')[1];

    // Check blacklist (if Redis is enabled)
    const redis = getRedis();
    if (redis) {
      const isBlacklisted = await redis.get(`blacklist:token:${token}`);
      if (isBlacklisted) throw new AppError('Token has been revoked', 401);
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(new AppError('Invalid token', 401));
    }
    if (error.name === 'TokenExpiredError') {
      return next(new AppError('Token expired', 401));
    }
    next(error);
  }
};

module.exports = { authenticate };
