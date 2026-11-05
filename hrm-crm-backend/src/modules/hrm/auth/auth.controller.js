const authService = require('./auth.service');
const { successResponse } = require('../../../shared/utils/response');
const { AppError } = require('../../../middlewares/error.middleware');

const register = async (req, res, next) => {
    try {
        const data = await authService.register(req.body);
        successResponse(res, data, 'Registered successfully', 201);
    } catch (e) {
        next(e);
    }
};

const login = async (req, res, next) => {
    try {
        const data = await authService.login(req.body, req);
        successResponse(res, data, 'Login successful');
    } catch (e) {
        next(e);
    }
};

const refreshToken = async (req, res, next) => {
    try {
        const data = await authService.refreshToken(req.body.refreshToken);
        successResponse(res, data);
    } catch (e) {
        next(e);
    }
};

const logout = async (req, res, next) => {
    try {
        await authService.logout(req.user, req.headers.authorization?.split(' ')[1]);
        successResponse(res, null, 'Logged out successfully');
    } catch (e) {
        next(e);
    }
};

const logoutAll = async (req, res, next) => {
    try {
        await authService.logoutAll(req.user.userId);
        successResponse(res, null, 'All sessions revoked');
    } catch (e) {
        next(e);
    }
};

const getMe = async (req, res, next) => {
    try {
        const data = await authService.getMe(req.user.userId);
        successResponse(res, data);
    } catch (e) {
        next(e);
    }
};

const getSessions = async (req, res, next) => {
    try {
        const data = await authService.getSessions(req.user.userId);
        successResponse(res, data);
    } catch (e) {
        next(e);
    }
};

const revokeSession = async (req, res, next) => {
    try {
        await authService.revokeSession(req.user.userId, req.params.id);
        successResponse(res, null, 'Session revoked');
    } catch (e) {
        next(e);
    }
};

const forgotPassword = async (req, res, next) => {
    try {
        await authService.forgotPassword(req.body.email);
        successResponse(res, null, 'Reset email sent');
    } catch (e) {
        next(e);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        await authService.resetPassword(req.body);
        successResponse(res, null, 'Password reset successful');
    } catch (e) {
        next(e);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        await authService.verifyEmail(req.body.token);
        successResponse(res, null, 'Email verified');
    } catch (e) {
        next(e);
    }
};

const changePassword = async (req, res, next) => {
    try {
        await authService.changePassword(req.user.userId, req.body);
        successResponse(res, null, 'Password changed');
    } catch (e) {
        next(e);
    }
};

const enable2FA = async (req, res, next) => {
    try {
        const data = await authService.enable2FA(req.user.userId);
        successResponse(res, data);
    } catch (e) {
        next(e);
    }
};

const verify2FA = async (req, res, next) => {
    try {
        await authService.verify2FA(req.user.userId, req.body.token);
        successResponse(res, null, '2FA enabled');
    } catch (e) {
        next(e);
    }
};

const disable2FA = async (req, res, next) => {
    try {
        await authService.disable2FA(req.user.userId, req.body.token);
        successResponse(res, null, '2FA disabled');
    } catch (e) {
        next(e);
    }
};

const googleAuth = async (req, res, next) => {
    next(new AppError('Google OAuth not configured', 501));
};

const googleCallback = async (req, res, next) => {
    next(new AppError('Google OAuth not configured', 501));
};

module.exports = {
    register,
    login,
    refreshToken,
    logout,
    logoutAll,
    getMe,
    getSessions,
    revokeSession,
    forgotPassword,
    resetPassword,
    verifyEmail,
    changePassword,
    enable2FA,
    verify2FA,
    disable2FA,
    googleAuth,
    googleCallback,
};