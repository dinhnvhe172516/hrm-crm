const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again later.' }
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'development' ? 100 : (parseInt(process.env.LOGIN_RATE_LIMIT_MAX) || 10),
  skipSuccessfulRequests: true, // Không đếm các lần đăng nhập thành công
  message: { success: false, message: 'Quá nhiều lần thử đăng nhập sai liên tiếp. Vui lòng thử lại sau 15 phút.' },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { apiLimiter, loginLimiter };
