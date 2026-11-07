const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { loginLimiter } = require('../../../middlewares/rateLimiter.middleware');
const { authenticate } = require('../../../middlewares/auth.middleware');

// Public routes
router.post('/register',             authController.register);
router.post('/login',                loginLimiter, authController.login);
router.post('/refresh-token',        authController.refreshToken);
router.post('/forgot-password',      loginLimiter, authController.forgotPassword);
router.post('/reset-password',       loginLimiter, authController.resetPassword);
router.post('/verify-email',         authController.verifyEmail);
router.post('/verify-email/otp',     authController.verifyEmailOtp);
router.post('/verify-email/resend',  loginLimiter, authController.resendVerifyEmail);
router.post('/2fa/verify',           loginLimiter, authController.verify2FA);
router.get('/google',                authController.googleAuth);
router.get('/google/callback',       authController.googleCallback);

// Protected routes
router.post('/logout',                       authenticate, authController.logout);
router.post('/logout-all',                   authenticate, authController.logoutAll);
router.get('/me',                            authenticate, authController.getMe);
router.get('/sessions',                      authenticate, authController.getSessions);
router.delete('/sessions/:id',               authenticate, authController.revokeSession);
router.post('/2fa/setup',                    authenticate, authController.setup2FA);
router.post('/2fa/confirm',                  authenticate, authController.confirm2FA);
router.post('/2fa/disable',                  authenticate, authController.disable2FA);
router.get('/2fa/backup-codes',              authenticate, authController.getBackupCodes);
router.post('/2fa/backup-codes/regenerate',  authenticate, authController.regenBackupCodes);
router.post('/change-password',              authenticate, authController.changePassword);

module.exports = router;
