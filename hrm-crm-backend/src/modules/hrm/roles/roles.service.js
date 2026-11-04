'use strict';

const Role = require('../../../shared/models/Role.model');
const Permission = require('../../../shared/models/Permission.model');
const User = require('../../../shared/models/User.model');
const { AppError } = require('../../../middlewares/error.middleware');
const { invalidateRolePermissionsCache } = require('../../../middlewares/rbac.middleware');
const logger = require('../../../shared/utils/logger');

const rolesService = {
  /**
   * Lấy danh sách roles kèm phân trang và đếm số users
   */
  getAll: async ({ skip = 0, limit = 20, query = {} }) => {
    const filter = {};
    if (query.keyword) {
      filter.$or = [
        { name: { $regex: query.keyword, $options: 'i' } },
        { code: { $regex: query.keyword, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      Role.find(filter)
        .populate('permissions', 'name code module action')
        .sort({ level: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Role.countDocuments(filter),
    ]);

    // Bổ sung số lượng user đang giữ role
    const rolesWithCounts = await Promise.all(
      data.map(async (role) => {
        const userCount = await User.countDocuments({ role: role._id });
        return {
          ...role,
          permissionCount: role.permissions?.length || 0,
          userCount,
        };
      })
    );

    return { data: rolesWithCounts, total };
  },

  /**
   * Lấy chi tiết role theo ID
   */
  getById: async (id) => {
    const role = await Role.findById(id).populate('permissions', 'name code module action description');
    if (!role) throw new AppError('Vai trò không tồn tại', 404);
    return role;
  },

  /**
   * Tạo role mới
   */
  create: async ({ name, code, description, level = 3, permissions = [] }) => {
    if (!name || !code) {
      throw new AppError('Tên vai trò và mã định danh là bắt buộc', 400);
    }

    const normalizedCode = code.toLowerCase().trim();
    const existing = await Role.findOne({ code: normalizedCode });
    if (existing) {
      throw new AppError('Mã vai trò đã tồn tại', 409);
    }

    const role = await Role.create({
      name: name.trim(),
      code: normalizedCode,
      description: description?.trim(),
      level: Number(level) || 3,
      isSystem: false,
      permissions,
    });

    logger.info(`Role created: ${role.code} (${role.name})`);
    return role;
  },

  /**
   * Cập nhật role & gán permissions
   */
  update: async (id, { name, description, level, permissions }) => {
    const role = await Role.findById(id);
    if (!role) throw new AppError('Vai trò không tồn tại', 404);

    if (name) role.name = name.trim();
    if (description !== undefined) role.description = description.trim();
    if (level !== undefined && !role.isSystem) role.level = Number(level);
    if (permissions !== undefined) role.permissions = permissions;

    await role.save();

    // Xóa Redis cache của role này ngay lập tức để cập nhật quyền real-time
    await invalidateRolePermissionsCache(role.code);

    logger.info(`Role updated: ${role.code}. Cache invalidated.`);
    return role;
  },

  /**
   * Xóa role
   */
  remove: async (id) => {
    const role = await Role.findById(id);
    if (!role) throw new AppError('Vai trò không tồn tại', 404);

    if (role.isSystem) {
      throw new AppError('Không thể xóa vai trò hệ thống mặc định', 400);
    }

    const userCount = await User.countDocuments({ role: id });
    if (userCount > 0) {
      throw new AppError(`Không thể xóa vai trò này vì đang có ${userCount} nhân viên được gán`, 400);
    }

    await Role.findByIdAndDelete(id);
    await invalidateRolePermissionsCache(role.code);

    logger.info(`Role deleted: ${role.code}`);
  },

  /**
   * Lấy toàn bộ danh mục permissions nhóm theo Module
   */
  getPermissionsGrouped: async () => {
    const permissions = await Permission.find().sort({ module: 1, action: 1 }).lean();

    const grouped = permissions.reduce((acc, perm) => {
      if (!acc[perm.module]) {
        acc[perm.module] = [];
      }
      acc[perm.module].push(perm);
      return acc;
    }, {});

    return {
      list: permissions,
      grouped,
      total: permissions.length,
    };
  },
};

module.exports = rolesService;

