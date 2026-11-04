'use strict';

const crypto         = require('crypto');
const jwt            = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

/**
 * Tạo JWT access token từ payload.
 * @param {object} payload - { userId, email, roleCode, roleLevel, sessionId }
 * @returns {string} signed JWT
 */
const generateAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_ACCESS_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m',
  });
};

/**
 * Tạo cặp refresh token:
 *  - plain: gửi về client (không lưu DB)
 *  - hash:  SHA-256 hash lưu vào DB
 * @returns {{ plain: string, hash: string }}
 */
const generateRefreshToken = () => {
  const plain = uuidv4() + '.' + crypto.randomBytes(32).toString('hex');
  const hash  = crypto.createHash('sha256').update(plain).digest('hex');
  return { plain, hash };
};

/**
 * Hash một chuỗi bằng SHA-256.
 * Dùng để hash refresh token trước khi lưu/so sánh với DB.
 * @param {string} value
 * @returns {string}
 */
const hashSHA256 = (value) => {
  return crypto.createHash('sha256').update(value).digest('hex');
};

module.exports = { generateAccessToken, generateRefreshToken, hashSHA256 };
