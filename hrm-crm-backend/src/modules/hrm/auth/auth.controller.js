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
        const data = await authService.forgotPassword(req.body.email, req);
        successResponse(res, data, data?.message || 'Email khôi phục đã được gửi');
    } catch (e) {
        next(e);
    }
};

const resetPassword = async (req, res, next) => {
    try {
        const data = await authService.resetPassword(req.body);
        successResponse(res, data, data?.message || 'Đặt lại mật khẩu thành công');
    } catch (e) {
        next(e);
    }
};

const verifyEmail = async (req, res, next) => {
    try {
        const payload = {
            token: req.body.token || req.query.token,
            otp:   req.body.otp,
            email: req.body.email || req.query.email,
        };
        const data = await authService.verifyEmail(payload);
        successResponse(res, data, data?.message || 'Xác minh email thành công');
    } catch (e) {
        next(e);
    }
};

const verifyEmailOtp = async (req, res, next) => {
    try {
        const data = await authService.verifyEmail({
            otp:   req.body.otp,
            email: req.body.email,
        });
        successResponse(res, data, data?.message || 'Xác minh email thành công');
    } catch (e) {
        next(e);
    }
};

const resendVerifyEmail = async (req, res, next) => {
    try {
        const data = await authService.resendVerifyEmail(req.body.email);
        successResponse(res, data, data?.message || 'Mã xác thực đã được gửi lại');
    } catch (e) {
        next(e);
    }
};

const changePassword = async (req, res, next) => {
    try {
        const data = await authService.changePassword(req.user.userId, req.body);
        successResponse(res, data, 'Đổi mật khẩu thành công');
    } catch (e) {
        next(e);
    }
};

const setup2FA = async (req, res, next) => {
    try {
        const data = await authService.setup2FA(req.user.userId);
        successResponse(res, data, 'Khởi tạo cấu hình 2FA thành công');
    } catch (e) {
        next(e);
    }
};

const confirm2FA = async (req, res, next) => {
    try {
        const data = await authService.confirm2FA(req.user.userId, req.body.token || req.body);
        successResponse(res, data, data?.message || '2FA đã được kích hoạt');
    } catch (e) {
        next(e);
    }
};

const verify2FA = async (req, res, next) => {
    try {
        // Hỗ trợ luồng login với tempToken + OTP
        if (req.body.tempToken) {
            const data = await authService.verify2FA({
                token:     req.body.token,
                tempToken: req.body.tempToken,
            }, req);
            return successResponse(res, data, 'Xác thực 2 bước thành công');
        }

        // Hoặc xác nhận kích hoạt khi user đã login
        if (req.user?.userId) {
            const data = await authService.confirm2FA(req.user.userId, req.body.token || req.body);
            return successResponse(res, data, '2FA đã được xác nhận');
        }

        throw new AppError('Thiếu thông tin xác thực 2FA', 400);
    } catch (e) {
        next(e);
    }
};

const disable2FA = async (req, res, next) => {
    try {
        const data = await authService.disable2FA(req.user.userId, req.body);
        successResponse(res, data, data?.message || 'Đã hủy kích hoạt 2FA');
    } catch (e) {
        next(e);
    }
};

const getBackupCodes = async (req, res, next) => {
    try {
        const data = await authService.getBackupCodes(req.user.userId);
        successResponse(res, data);
    } catch (e) {
        next(e);
    }
};

const regenBackupCodes = async (req, res, next) => {
    try {
        const data = await authService.regenBackupCodes(req.user.userId, req.body);
        successResponse(res, data, data?.message || 'Đã tạo lại mã dự phòng mới');
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
    verifyEmailOtp,
    resendVerifyEmail,
    changePassword,
    setup2FA,
    confirm2FA,
    verify2FA,
    disable2FA,
    getBackupCodes,
    regenBackupCodes,
    googleAuth,
    googleCallback,
};