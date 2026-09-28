require('dotenv').config();

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT) || 5000,
  CLIENT_URL: process.env.CLIENT_URL || 'http://localhost:3000',
  MONGODB_URI: process.env.MONGODB_URI,
  JWT: {
    ACCESS_SECRET: process.env.JWT_ACCESS_SECRET,
    ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '15m',
    REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
    REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',
  },
  BCRYPT_ROUNDS: parseInt(process.env.BCRYPT_ROUNDS) || 12,
  SESSION: {
    LIFETIME_DAYS: parseInt(process.env.SESSION_LIFETIME_DAYS) || 7,
    MAX_PER_USER: parseInt(process.env.MAX_SESSIONS_PER_USER) || 5,
  },
};
