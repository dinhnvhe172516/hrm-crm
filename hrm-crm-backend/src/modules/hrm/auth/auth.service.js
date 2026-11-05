'use strict';

const bcrypt         = require('bcryptjs');
const jwt            = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const User           = require('../../../shared/models/User.model');
const Role           = require('../../../shared/models/Role.model');
const Department     = require('../../../shared/models/Department.model');
const Position       = require('../../../shared/models/Position.model');
const UserCredential = require('./UserCredential.model');
const RefreshToken   = require('./RefreshToken.model');
const UserSession    = require('./UserSession.model');
const LoginHistory   = require('./LoginHistory.model');
const { AppError }   = require('../../../middlewares/error.middleware');
const { getRedis }   = require('../../../config/redis');
const { getRolePermissions } = require('../../../middlewares/rbac.middleware');
const logger         = require('../../../shared/utils/logger');

const { generateAccessToken, generateRefreshToken, hashSHA256 } = require('../../../shared/helpers/token');
const { parseDeviceInfo }  = require('../../../shared/helpers/device');
const { writeAuditLog }    = require('../../../shared/helpers/auditLog');
const {
  MAX_FAILED_ATTEMPTS,
  LOCK_DURATION_MS,
  PASSWORD_MIN_LENGTH,
  PASSWORD_HISTORY_LIMIT,
  DEFAULT_MAX_SESSIONS_PER_USER,
  DEFAULT_SESSION_LIFETIME_DAYS,
  DEFAULT_REFRESH_EXPIRES_DAYS,
  FAILURE_REASON,
  REVOKE_REASON,
} = require('../../../shared/constants/auth');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

// ─── AUTH SERVICE ─────────────────────────────────────────────────────────────
const authService = {

  // ═══════════════════════════════════════════════════════════════════════════
  // REGISTER
  // ═══════════════════════════════════════════════════════════════════════════
  register: async ({ email, password, fullName, phone }) => {
    if (!email || !password || !fullName) {
      throw new AppError('Email, mật khẩu và họ tên là bắt buộc', 400);
    }
    if (password.length < PASSWORD_MIN_LENGTH) {
      throw new AppError(`Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`, 400);
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) throw new AppError('Email đã được sử dụng', 409);

    const user = await User.create({
      email:           email.toLowerCase().trim(),
      fullName:        fullName.trim(),
      phone:           phone?.trim(),
      isEmailVerified: false,
      isActive:        true,
      status:          'probation',
    });

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    await UserCredential.create({ userId: user._id, passwordHash, mustChangePassword: false });

    logger.info(`User registered: ${user.email}`);
    return { userId: user._id, email: user.email, fullName: user.fullName };
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGIN
  // ═══════════════════════════════════════════════════════════════════════════
  login: async ({ email, password }, req) => {
    if (!email || !password) {
      throw new AppError('Email và mật khẩu là bắt buộc', 400);
    }

    const device = parseDeviceInfo(req);
    const baseHistory = {
      email:      email.toLowerCase().trim(),
      ipAddress:  device.ipAddress,
      userAgent:  device.userAgent,
      location:   device.location,
      deviceInfo: device.deviceInfo,
    };

    // ── 1. Tìm user theo Email hoặc Mã nhân viên (employeeCode) ──────────────
    const loginIdentifier = email.trim();
    logger.info(`🔑 Yêu cầu đăng nhập: "${loginIdentifier}"`);
    const query = loginIdentifier.includes('@')
      ? { email: loginIdentifier.toLowerCase() }
      : { $or: [{ email: loginIdentifier.toLowerCase() }, { employeeCode: loginIdentifier.toUpperCase() }] };

    const user = await User.findOne(query)
      .select('+failedLoginAttempts +lockUntil +lastLoginAt +isActive +status +isEmailVerified')
      .populate('role', 'code name level')
      .populate('department', 'name code')
      .populate('position', 'title code level');

    if (!user) {
      logger.warn(`❌ Không tìm thấy tài khoản với email/mã NV: "${loginIdentifier}"`);
      await writeAuditLog(LoginHistory, { ...baseHistory, isSuccess: false, failureReason: FAILURE_REASON.NOT_FOUND });
      throw new AppError('Email hoặc mật khẩu không đúng', 401);
    }

    baseHistory.userId = user._id;

    // ── 2. Kiểm tra account lock ───────────────────────────────────────────
    if (user.lockUntil && user.lockUntil > new Date()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      await writeAuditLog(LoginHistory, { ...baseHistory, isSuccess: false, failureReason: FAILURE_REASON.ACCOUNT_LOCKED });
      throw new AppError(
        `Tài khoản bị tạm khóa. Vui lòng thử lại sau ${minutesLeft} phút.`,
        423
      );
    }

    // ── 3. Kiểm tra tài khoản active ──────────────────────────────────────
    if (!user.isActive) {
      await writeAuditLog(LoginHistory, { ...baseHistory, isSuccess: false, failureReason: FAILURE_REASON.ACCOUNT_INACTIVE });
      throw new AppError('Tài khoản đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.', 403);
    }

    // ── 4. Xác minh mật khẩu ──────────────────────────────────────────────
    const credential = await UserCredential.findOne({ userId: user._id });
    if (!credential) throw new AppError('Lỗi cấu hình tài khoản. Vui lòng liên hệ quản trị viên.', 500);

    const isPasswordValid = await bcrypt.compare(password, credential.passwordHash);

    if (!isPasswordValid) {
      const failedAttempts = (user.failedLoginAttempts || 0) + 1;
      const updateData     = { failedLoginAttempts: failedAttempts };

      if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
        updateData.lockUntil = new Date(Date.now() + LOCK_DURATION_MS);
        logger.warn(`Account locked: ${user.email}`);
      }

      await User.findByIdAndUpdate(user._id, updateData);
      await writeAuditLog(LoginHistory, { ...baseHistory, isSuccess: false, failureReason: FAILURE_REASON.WRONG_PASSWORD });

      const remaining = MAX_FAILED_ATTEMPTS - failedAttempts;
      if (remaining > 0) {
        throw new AppError(`Email hoặc mật khẩu không đúng. Còn ${remaining} lần thử.`, 401);
      }
      throw new AppError('Tài khoản bị tạm khóa 30 phút do đăng nhập sai quá nhiều lần.', 423);
    }

    // ── 5. Reset failed attempts ───────────────────────────────────────────
    await User.findByIdAndUpdate(user._id, {
      failedLoginAttempts: 0,
      lockUntil:           null,
      lastLoginAt:         new Date(),
    });

    // ── 6. Giới hạn số phiên đồng thời ────────────────────────────────────
    const maxSessions    = parseInt(process.env.MAX_SESSIONS_PER_USER) || DEFAULT_MAX_SESSIONS_PER_USER;
    const activeSessions = await UserSession.find({ userId: user._id, isActive: true }).sort({ lastActivityAt: 1 });

    if (activeSessions.length >= maxSessions) {
      const oldest = activeSessions[0];
      await UserSession.findByIdAndUpdate(oldest._id, { isActive: false, loggedOutAt: new Date() });
      await RefreshToken.updateMany(
        { sessionId: oldest._id },
        { isRevoked: true, revokedAt: new Date(), revokedReason: REVOKE_REASON.LOGOUT }
      );
    }

    // ── 7. Tạo session mới ────────────────────────────────────────────────
    const sessionLifetimeDays = parseInt(process.env.SESSION_LIFETIME_DAYS) || DEFAULT_SESSION_LIFETIME_DAYS;
    const session = await UserSession.create({
      userId:       user._id,
      sessionToken: uuidv4(),
      deviceInfo: {
        deviceName: device.deviceName,
        deviceType: device.deviceType,
        browser:    device.deviceInfo.browser,
        os:         device.deviceInfo.os,
        ipAddress:  device.ipAddress,
        location:   device.location,
      },
      isActive:  true,
      expiresAt: new Date(Date.now() + sessionLifetimeDays * 24 * 60 * 60 * 1000),
    });

    // ── 8. Tạo tokens ─────────────────────────────────────────────────────
    const tokenPayload = {
      userId:    user._id.toString(),
      email:     user.email,
      role:      user.role?.code  || null,
      roleCode:  user.role?.code  || null,
      roleLevel: user.role?.level || null,
      sessionId: session._id.toString(),
    };

    const accessToken                              = generateAccessToken(tokenPayload);
    const { plain: refreshPlain, hash: refreshHash } = generateRefreshToken();
    const refreshExpiresDays = parseInt(process.env.JWT_REFRESH_EXPIRES) || DEFAULT_REFRESH_EXPIRES_DAYS;

    await RefreshToken.create({
      userId:    user._id,
      sessionId: session._id,
      token:     refreshHash,
      family:    uuidv4(),
      isRevoked: false,
      expiresAt: new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000),
    });

    // ── 9. Ghi lịch sử đăng nhập ──────────────────────────────────────────
    await writeAuditLog(LoginHistory, { ...baseHistory, isSuccess: true, sessionId: session._id });

    // Lấy permissions (ưu tiên Redis cache)
    const permissions = await getRolePermissions(user.role?.code);

    logger.info(`User logged in: ${user.email} from ${device.ipAddress}`);

    return {
      accessToken,
      refreshToken:       refreshPlain,
      tokenType:          'Bearer',
      expiresIn:          process.env.JWT_ACCESS_EXPIRES || '15m',
      mustChangePassword: credential.mustChangePassword || false,
      user: {
        id:              user._id,
        employeeCode:    user.employeeCode || null,
        email:           user.email,
        fullName:        user.fullName,
        avatar:          user.avatar || null,
        role:            user.role ? { code: user.role.code, name: user.role.name, level: user.role.level } : null,
        department:      user.department ? { code: user.department.code, name: user.department.name } : null,
        position:        user.position ? { code: user.position.code, title: user.position.title } : null,
        permissions,
        isEmailVerified: user.isEmailVerified,
        status:          user.status,
        lastLoginAt:     user.lastLoginAt,
      },
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REFRESH TOKEN (Rotation strategy)
  // ═══════════════════════════════════════════════════════════════════════════
  refreshToken: async (plainToken) => {
    if (!plainToken) throw new AppError('Refresh token là bắt buộc', 400);

    const tokenHash   = hashSHA256(plainToken);
    const storedToken = await RefreshToken.findOne({ token: tokenHash })
      .populate({ path: 'sessionId', select: 'isActive expiresAt' });

    if (!storedToken) throw new AppError('Refresh token không hợp lệ', 401);

    if (storedToken.isRevoked) {
      logger.warn(`Refresh token reuse detected, family: ${storedToken.family}`);
      await RefreshToken.updateMany(
        { family: storedToken.family },
        { isRevoked: true, revokedAt: new Date(), revokedReason: REVOKE_REASON.SECURITY_BREACH }
      );
      if (storedToken.sessionId) {
        await UserSession.findByIdAndUpdate(storedToken.sessionId, { isActive: false, loggedOutAt: new Date() });
      }
      throw new AppError('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.', 401);
    }

    if (storedToken.expiresAt < new Date()) {
      await RefreshToken.findByIdAndUpdate(storedToken._id, {
        isRevoked: true, revokedReason: REVOKE_REASON.EXPIRED, revokedAt: new Date(),
      });
      throw new AppError('Refresh token đã hết hạn. Vui lòng đăng nhập lại.', 401);
    }

    if (!storedToken.sessionId?.isActive) {
      throw new AppError('Phiên đăng nhập đã bị thu hồi. Vui lòng đăng nhập lại.', 401);
    }

    const user = await User.findById(storedToken.userId)
      .select('email fullName avatar isActive status')
      .populate('role', 'code name level');

    if (!user || !user.isActive) throw new AppError('Tài khoản không còn hoạt động', 403);

    const { plain: newPlain, hash: newHash } = generateRefreshToken();
    await RefreshToken.findByIdAndUpdate(storedToken._id, {
      isRevoked: true, revokedAt: new Date(), revokedReason: REVOKE_REASON.USED, replacedByToken: newHash,
    });

    const refreshExpiresDays = parseInt(process.env.JWT_REFRESH_EXPIRES) || DEFAULT_REFRESH_EXPIRES_DAYS;
    await RefreshToken.create({
      userId:    storedToken.userId,
      sessionId: storedToken.sessionId._id,
      token:     newHash,
      family:    storedToken.family,
      isRevoked: false,
      expiresAt: new Date(Date.now() + refreshExpiresDays * 24 * 60 * 60 * 1000),
    });

    await UserSession.findByIdAndUpdate(storedToken.sessionId._id, { lastActivityAt: new Date() });

    const tokenPayload = {
      userId:    user._id.toString(),
      email:     user.email,
      role:      user.role?.code  || null,
      roleCode:  user.role?.code  || null,
      roleLevel: user.role?.level || null,
      sessionId: storedToken.sessionId._id.toString(),
    };

    return {
      accessToken:  generateAccessToken(tokenPayload),
      refreshToken: newPlain,
      tokenType:    'Bearer',
      expiresIn:    process.env.JWT_ACCESS_EXPIRES || '15m',
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGOUT
  // ═══════════════════════════════════════════════════════════════════════════
  logout: async (user, accessToken) => {
    const { userId, sessionId } = user;

    if (accessToken) {
      const redis = getRedis();
      if (redis) {
        try {
          const decoded = jwt.decode(accessToken);
          if (decoded?.exp) {
            const ttl = decoded.exp - Math.floor(Date.now() / 1000);
            if (ttl > 0) await redis.setEx(`blacklist:token:${accessToken}`, ttl, '1');
          }
        } catch (err) {
          logger.error('Failed to blacklist token:', err.message);
        }
      }
    }

    if (sessionId) {
      await UserSession.findByIdAndUpdate(sessionId, { isActive: false, loggedOutAt: new Date() });
      await RefreshToken.updateMany(
        { sessionId, isRevoked: false },
        { isRevoked: true, revokedAt: new Date(), revokedReason: REVOKE_REASON.LOGOUT }
      );
    }

    logger.info(`User logged out: ${userId}`);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // LOGOUT ALL SESSIONS
  // ═══════════════════════════════════════════════════════════════════════════
  logoutAll: async (userId) => {
    await UserSession.updateMany({ userId, isActive: true }, { isActive: false, loggedOutAt: new Date() });
    await RefreshToken.updateMany(
      { userId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: REVOKE_REASON.LOGOUT_ALL }
    );
    logger.info(`All sessions revoked for user: ${userId}`);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GET ME
  // ═══════════════════════════════════════════════════════════════════════════
  getMe: async (userId) => {
    const user = await User.findById(userId)
      .select('-__v')
      .populate('role',       'code name level')
      .populate('department', 'name code')
      .populate('position',   'title code level');

    if (!user) throw new AppError('Người dùng không tồn tại', 404);

    const permissions = await getRolePermissions(user.role?.code);

    return {
      ...user.toObject(),
      permissions,
    };
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GET SESSIONS
  // ═══════════════════════════════════════════════════════════════════════════
  getSessions: async (userId) => {
    return UserSession.find({ userId, isActive: true })
      .select('sessionToken deviceInfo lastActivityAt expiresAt createdAt')
      .sort({ lastActivityAt: -1 });
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REVOKE SESSION
  // ═══════════════════════════════════════════════════════════════════════════
  revokeSession: async (userId, sessionId) => {
    const session = await UserSession.findOne({ _id: sessionId, userId });
    if (!session) throw new AppError('Phiên đăng nhập không tồn tại', 404);

    await UserSession.findByIdAndUpdate(sessionId, { isActive: false, loggedOutAt: new Date() });
    await RefreshToken.updateMany(
      { sessionId, isRevoked: false },
      { isRevoked: true, revokedAt: new Date(), revokedReason: REVOKE_REASON.LOGOUT }
    );
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // FORGOT PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════
  forgotPassword: async (email) => {
    if (!email) throw new AppError('Email là bắt buộc', 400);
    // TODO: Tạo PasswordResetToken, gửi email qua nodemailer
    logger.info(`Password reset requested for: ${email}`);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // RESET PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════
  resetPassword: async ({ token, newPassword }) => {
    if (!token || !newPassword) throw new AppError('Token và mật khẩu mới là bắt buộc', 400);
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      throw new AppError(`Mật khẩu phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`, 400);
    }
    // TODO: verify PasswordResetToken, update UserCredential
    throw new AppError('Chức năng đang được phát triển', 501);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VERIFY EMAIL
  // ═══════════════════════════════════════════════════════════════════════════
  verifyEmail: async (token) => {
    if (!token) throw new AppError('Token xác thực là bắt buộc', 400);
    // TODO: verify EmailVerification token
    throw new AppError('Chức năng đang được phát triển', 501);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CHANGE PASSWORD
  // ═══════════════════════════════════════════════════════════════════════════
  changePassword: async (userId, { currentPassword, newPassword }) => {
    if (!currentPassword || !newPassword) {
      throw new AppError('Mật khẩu hiện tại và mật khẩu mới là bắt buộc', 400);
    }
    if (newPassword.length < PASSWORD_MIN_LENGTH) {
      throw new AppError(`Mật khẩu mới phải có ít nhất ${PASSWORD_MIN_LENGTH} ký tự`, 400);
    }

    const credential = await UserCredential.findOne({ userId });
    if (!credential) throw new AppError('Không tìm thấy thông tin tài khoản', 404);

    const isValid = await bcrypt.compare(currentPassword, credential.passwordHash);
    if (!isValid) throw new AppError('Mật khẩu hiện tại không đúng', 401);

    for (const prev of credential.passwordHistory?.slice(-PASSWORD_HISTORY_LIMIT) || []) {
      const isDuplicate = await bcrypt.compare(newPassword, prev.hash);
      if (isDuplicate) {
        throw new AppError(`Không thể dùng lại ${PASSWORD_HISTORY_LIMIT} mật khẩu gần đây`, 400);
      }
    }

    const newHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await UserCredential.findByIdAndUpdate(credential._id, {
      $push:              { passwordHistory: { hash: credential.passwordHash, changedAt: new Date() } },
      passwordHash:       newHash,
      mustChangePassword: false,
    });
    await User.findByIdAndUpdate(userId, { passwordChangedAt: new Date() });

    logger.info(`Password changed for user: ${userId}`);
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // 2FA — TODO: dùng speakeasy
  // ═══════════════════════════════════════════════════════════════════════════
  enable2FA:  async (_userId)         => { throw new AppError('Chức năng đang được phát triển', 501); },
  verify2FA:  async (_userId, _token) => { throw new AppError('Chức năng đang được phát triển', 501); },
  disable2FA: async (_userId, _token) => { throw new AppError('Chức năng đang được phát triển', 501); },
};

module.exports = authService;
