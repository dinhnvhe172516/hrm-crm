const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { loginLimiter } = require('../../../middlewares/rateLimiter.middleware');
const { authenticate } = require('../../../middlewares/auth.middleware');

// Public routes
router.post('/register',         authController.register);
router.post('/login',            loginLimiter, authController.login);
router.post('/refresh-token',    authController.refreshToken);
router.post('/forgot-password',  loginLimiter, authController.forgotPassword);
router.post('/reset-password',   loginLimiter, authController.resetPassword);
router.post('/verify-email',     authController.verifyEmail);
router.get('/google',            authController.googleAuth);
router.get('/google/callback',   authController.googleCallback);

// Protected routes
router.post('/logout',           authenticate, authController.logout);
router.post('/logout-all',       authenticate, authController.logoutAll);
router.get('/me',                authenticate, authController.getMe);
router.get('/sessions',          authenticate, authController.getSessions);
router.delete('/sessions/:id',   authenticate, authController.revokeSession);
router.post('/2fa/enable',       authenticate, authController.enable2FA);
router.post('/2fa/verify',       authenticate, authController.verify2FA);
router.post('/2fa/disable',      authenticate, authController.disable2FA);
router.post('/change-password',  authenticate, authController.changePassword);

module.exports = router;
