'use strict';

const bcrypt         = require('bcryptjs');
const User           = require('../../../shared/models/User.model');
const Role           = require('../../../shared/models/Role.model');
const Department     = require('../../../shared/models/Department.model');
const Position       = require('../../../shared/models/Position.model');
const UserCredential = require('../auth/UserCredential.model');
const UserSession    = require('../auth/UserSession.model');
const RefreshToken   = require('../auth/RefreshToken.model');
const LoginHistory   = require('../auth/LoginHistory.model');
const TwoFactorAuth  = require('../auth/TwoFactorAuth.model');
const { AppError }   = require('../../../middlewares/error.middleware');
const { invalidateRolePermissionsCache } = require('../../../middlewares/rbac.middleware');
const logger         = require('../../../shared/utils/logger');
const { REVOKE_REASON } = require('../../../shared/constants/auth');

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

/**
 * Tự động sinh mã nhân sự kế tiếp (VD: NV001, NV002, ...)
 */
const generateNextEmployeeCode = async () => {
  const latestUser = await User.findOne({ employeeCode: /^NV\d+$/i })
    .sort({ employeeCode: -1 })
    .select('employeeCode')
    .lean();

  if (!latestUser || !latestUser.employeeCode) {
    return 'NV001';
  }

  const numPart = parseInt(latestUser.employeeCode.replace(/\D/g, ''), 10);
  const nextNum = isNaN(numPart) ? 1 : numPart + 1;
  return `NV${nextNum.toString().padStart(3, '0')}`;
};

const usersService = {
  /**
   * Lấy danh sách nhân viên có phân trang, lọc nâng cao và tìm kiếm
   */
  getAll: async ({ skip = 0, limit = 20, query = {} }) => {
    const filter = {};

    // Tìm kiếm đa trường: Họ tên, Email, Mã NV, Số điện thoại
    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { fullName:     searchRegex },
        { email:        searchRegex },
        { employeeCode: searchRegex },
        { phone:        searchRegex },
      ];
    }

    if (query.department) {
      filter.department = query.department;
    }

    if (query.position) {
      filter.position = query.position;
    }

    if (query.role) {
      // Có thể truyền ObjectId hoặc role code
      if (query.role.match(/^[0-9a-fA-F]{24}$/)) {
        filter.role = query.role;
      } else {
        const roleDoc = await Role.findOne({ code: query.role });
        if (roleDoc) filter.role = roleDoc._id;
      }
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-__v')
        .populate('department', 'name code')
        .populate('position',   'title code level')
        .populate('role',       'name code level')
        .populate('managerId',  'fullName email employeeCode avatar')
        .sort({ [sortField]: sortOrder })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      User.countDocuments(filter),
    ]);

    return { data: users, total };
  },

  /**
   * Lấy chi tiết hồ sơ nhân sự (kèm thông tin bảo mật, 2FA, lịch sử đăng nhập)
   */
  getById: async (id) => {
    const user = await User.findById(id)
      .select('-__v')
      .populate('department', 'name code location')
      .populate('position',   'title code level')
      .populate('role',       'name code level')
      .populate('managerId',  'fullName email employeeCode avatar phone')
      .lean();

    if (!user) throw new AppError('Nhân viên không tồn tại', 404);

    const [twoFactor, activeSessions, recentLogins] = await Promise.all([
      TwoFactorAuth.findOne({ userId: id }).select('isEnabled totp.isVerified totp.enabledAt').lean(),
      UserSession.countDocuments({ userId: id, isActive: true }),
      LoginHistory.find({ userId: id }).sort({ createdAt: -1 }).limit(5).lean(),
    ]);

    return {
      ...user,
      security: {
        isTwoFactorEnabled: Boolean(twoFactor?.isEnabled && twoFactor?.totp?.isVerified),
        activeSessions,
        recentLogins,
      },
    };
  },

  /**
   * Tạo hồ sơ nhân sự mới + Tự động cấp tài khoản đăng nhập (UserCredential)
   */
  create: async (data, creatorUser) => {
    const {
      fullName,
      email,
      phone,
      employeeCode,
      department,
      position,
      role,
      managerId,
      status = 'probation',
      gender,
      dateOfBirth,
      joinDate,
      probationEndDate,
      address,
      identityCard,
      bankAccount,
      taxCode,
      insuranceCode,
      initialPassword,
    } = data;

    if (!fullName || !email) {
      throw new AppError('Họ tên và email là thông tin bắt buộc', 400);
    }

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      throw new AppError(`Email "${normalizedEmail}" đã được sử dụng bởi nhân sự khác`, 409);
    }

    // Xác định mã nhân viên
    let finalEmployeeCode = employeeCode?.trim().toUpperCase();
    if (!finalEmployeeCode) {
      finalEmployeeCode = await generateNextEmployeeCode();
    } else {
      const codeExists = await User.findOne({ employeeCode: finalEmployeeCode });
      if (codeExists) {
        throw new AppError(`Mã nhân viên "${finalEmployeeCode}" đã tồn tại`, 409);
      }
    }

    // Xác định vai trò (nếu không chọn, mặc định lấy role 'employee')
    let assignedRoleId = role;
    if (!assignedRoleId) {
      const defaultRole = await Role.findOne({ code: 'employee' });
      if (defaultRole) assignedRoleId = defaultRole._id;
    }

    // 1. Tạo bản ghi User
    const newUser = await User.create({
      fullName:         fullName.trim(),
      email:            normalizedEmail,
      phone:            phone?.trim(),
      employeeCode:     finalEmployeeCode,
      department:       department || null,
      position:         position || null,
      role:             assignedRoleId || null,
      managerId:        managerId || null,
      status,
      gender,
      dateOfBirth,
      joinDate:         joinDate || new Date(),
      probationEndDate,
      address,
      identityCard,
      bankAccount,
      taxCode,
      insuranceCode,
      isActive:         true,
      isEmailVerified:  false,
    });

    // 2. Tạo mật khẩu khởi tạo & UserCredential
    const rawPassword = initialPassword?.trim() || 'Password@123';
    const passwordHash = await bcrypt.hash(rawPassword, BCRYPT_ROUNDS);

    await UserCredential.create({
      userId:                   newUser._id,
      passwordHash,
      mustChangePassword:       true,
      mustChangePasswordReason: 'first_login',
    });

    logger.info(`Employee profile & credentials created: ${newUser.employeeCode} (${newUser.email}) by ${creatorUser?.email || creatorUser?.userId}`);

    // Populate dữ liệu trả về cho client
    const populatedUser = await User.findById(newUser._id)
      .populate('department', 'name code')
      .populate('position',   'title code level')
      .populate('role',       'name code level')
      .lean();

    return {
      ...populatedUser,
      initialPassword: rawPassword, // Gửi lại một lần duy nhất để HR bàn giao cho nhân sự mới
    };
  },

  /**
   * Cập nhật thông tin nhân sự
   */
  update: async (id, data, modifierUser) => {
    const user = await User.findById(id);
    if (!user) throw new AppError('Nhân viên không tồn tại', 404);

    const {
      fullName,
      phone,
      avatar,
      employeeCode,
      department,
      position,
      role,
      managerId,
      status,
      gender,
      dateOfBirth,
      joinDate,
      probationEndDate,
      address,
      identityCard,
      bankAccount,
      taxCode,
      insuranceCode,
      isActive,
    } = data;

    if (employeeCode) {
      const normalizedCode = employeeCode.trim().toUpperCase();
      if (normalizedCode !== user.employeeCode) {
        const codeExists = await User.findOne({ employeeCode: normalizedCode, _id: { $ne: id } });
        if (codeExists) throw new AppError(`Mã nhân viên "${normalizedCode}" đã tồn tại`, 409);
        user.employeeCode = normalizedCode;
      }
    }

    if (role && role.toString() !== user.role?.toString()) {
      // Khi thay đổi vai trò hệ thống, xóa cache phân quyền của vai trò cũ
      const oldRole = await Role.findById(user.role);
      if (oldRole) invalidateRolePermissionsCache(oldRole.code);
      user.role = role;
    }

    if (fullName)         user.fullName         = fullName.trim();
    if (phone !== undefined) user.phone         = phone?.trim();
    if (avatar !== undefined) user.avatar       = avatar;
    if (department !== undefined) user.department = department || null;
    if (position !== undefined) user.position   = position || null;
    if (managerId !== undefined) user.managerId = managerId || null;
    if (status !== undefined) user.status       = status;
    if (gender !== undefined) user.gender       = gender;
    if (dateOfBirth !== undefined) user.dateOfBirth = dateOfBirth;
    if (joinDate !== undefined) user.joinDate   = joinDate;
    if (probationEndDate !== undefined) user.probationEndDate = probationEndDate;
    if (address)          user.address          = { ...user.address, ...address };
    if (identityCard)     user.identityCard     = { ...user.identityCard, ...identityCard };
    if (bankAccount)      user.bankAccount      = { ...user.bankAccount, ...bankAccount };
    if (taxCode !== undefined) user.taxCode     = taxCode;
    if (insuranceCode !== undefined) user.insuranceCode = insuranceCode;
    if (isActive !== undefined) user.isActive   = Boolean(isActive);

    await user.save();
    logger.info(`Employee profile updated: ${user.employeeCode} by ${modifierUser?.email || modifierUser?.userId}`);

    return User.findById(id)
      .populate('department', 'name code')
      .populate('position',   'title code level')
      .populate('role',       'name code level')
      .populate('managerId',  'fullName email employeeCode')
      .lean();
  },

  /**
   * Reset mật khẩu nhân sự bởi Admin / HR Manager
   */
  resetPassword: async (id, { newPassword = 'Password@123', mustChangePassword = true }, adminUser) => {
    const user = await User.findById(id);
    if (!user) throw new AppError('Nhân viên không tồn tại', 404);

    const credential = await UserCredential.findOne({ userId: id });
    if (!credential) throw new AppError('Không tìm thấy thông tin xác thực tài khoản', 404);

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await UserCredential.findByIdAndUpdate(credential._id, {
      $push: { passwordHistory: { hash: credential.passwordHash, changedAt: new Date() } },
      passwordHash,
      mustChangePassword: Boolean(mustChangePassword),
      mustChangePasswordReason: 'admin_reset',
    });

    // Mở khóa tài khoản nếu đang bị khóa
    await User.findByIdAndUpdate(id, {
      failedLoginAttempts: 0,
      lockUntil:           null,
      passwordChangedAt:   new Date(),
    });

    // Thu hồi mọi phiên làm việc hiện tại của nhân sự này để bảo mật
    await UserSession.updateMany({ userId: id, isActive: true }, { isActive: false, loggedOutAt: new Date() });
    await RefreshToken.updateMany({ userId: id, isRevoked: false }, { isRevoked: true, revokedAt: new Date(), revokedReason: REVOKE_REASON.LOGOUT_ALL });

    logger.info(`Password for user ${user.email} was reset by ${adminUser?.email || adminUser?.userId}`);

    return {
      message:     `Đã đặt lại mật khẩu cho nhân viên ${user.fullName} (${user.employeeCode})`,
      newPassword,
    };
  },

  /**
   * Xóa nhân sự (Soft delete: vô hiệu hóa tài khoản và chuyển trạng thái)
   */
  remove: async (id, adminUser) => {
    const user = await User.findById(id);
    if (!user) throw new AppError('Nhân viên không tồn tại', 404);

    user.isActive = false;
    user.status   = 'terminated';
    await user.save();

    // Thu hồi phiên đăng nhập
    await UserSession.updateMany({ userId: id, isActive: true }, { isActive: false, loggedOutAt: new Date() });
    await RefreshToken.updateMany({ userId: id, isRevoked: false }, { isRevoked: true, revokedAt: new Date(), revokedReason: REVOKE_REASON.LOGOUT_ALL });

    logger.info(`Employee deactivated: ${user.employeeCode} by ${adminUser?.email || adminUser?.userId}`);
    return { message: 'Đã vô hiệu hóa tài khoản nhân sự thành công' };
  },

  /**
   * Thống kê tổng quan nhân sự cho Dashboard
   */
  getStats: async () => {
    const [total, active, probation, official, resigned, departmentBreakdown] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ status: 'probation', isActive: true }),
      User.countDocuments({ status: 'official',  isActive: true }),
      User.countDocuments({ status: 'resigned' }),
      User.aggregate([
        { $match: { isActive: true, department: { $ne: null } } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
        { $lookup: { from: 'departments', localField: '_id', foreignField: '_id', as: 'dept' } },
        { $unwind: '$dept' },
        { $project: { _id: 1, count: 1, name: '$dept.name', code: '$dept.code' } },
      ]),
    ]);

    return {
      total,
      active,
      probation,
      official,
      resigned,
      departmentBreakdown,
    };
  },
};

module.exports = usersService;
