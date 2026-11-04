'use strict';

const { AppError } = require('./error.middleware');
const { getRedis } = require('../config/redis');
const Role = require('../shared/models/Role.model');
const logger = require('../shared/utils/logger');

const ROLE_PERMS_CACHE_TTL = 3600; // 1 hour

/**
 * Lấy danh sách mã permission theo roleCode, ưu tiên Redis Cache và fallback MongoDB.
 * @param {string} roleCode
 * @returns {Promise<string[]>}
 */
const getRolePermissions = async (roleCode) => {
  if (!roleCode) return [];

  // Super Admin luôn có toàn quyền
  if (roleCode === 'super_admin') return ['*'];

  const cacheKey = `role:permissions:${roleCode}`;
  const redis = getRedis();

  // 1. Kiểm tra cache Redis
  if (redis) {
    try {
      const cached = await redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch (err) {
      logger.warn(`Redis get permissions error: ${err.message}`);
    }
  }

  // 2. Query MongoDB nếu cache miss hoặc Redis offline
  try {
    const role = await Role.findOne({ code: roleCode }).populate('permissions', 'code');
    if (!role || !role.permissions) {
      return [];
    }

    const permissions = role.permissions.map((p) => p.code).filter(Boolean);

    // 3. Lưu vào Redis Cache
    if (redis) {
      try {
        await redis.setEx(cacheKey, ROLE_PERMS_CACHE_TTL, JSON.stringify(permissions));
      } catch (err) {
        logger.warn(`Redis set permissions error: ${err.message}`);
      }
    }

    return permissions;
  } catch (dbErr) {
    logger.error(`Database error fetching role permissions: ${dbErr.message}`);
    return [];
  }
};

/**
 * Xóa cache permissions của 1 role hoặc toàn bộ role khi Admin thay đổi quyền
 * @param {string} [roleCode]
 */
const invalidateRolePermissionsCache = async (roleCode) => {
  const redis = getRedis();
  if (!redis) return;

  try {
    if (roleCode) {
      await redis.del(`role:permissions:${roleCode}`);
      logger.info(`Invalidated permissions cache for role: ${roleCode}`);
    } else {
      const keys = await redis.keys('role:permissions:*');
      if (keys.length > 0) {
        await redis.del(keys);
        logger.info(`Invalidated all role permission caches (${keys.length} keys)`);
      }
    }
  } catch (err) {
    logger.warn(`Failed to invalidate role permissions cache: ${err.message}`);
  }
};

/**
 * Middleware phân quyền theo chức năng (Permission-Based Access Control)
 * Hỗ trợ wildcard: '*' (toàn quyền) hoặc 'module:*' (toàn quyền trên module)
 * @param  {...string} requiredPermissions Danh sách quyền yêu cầu (chỉ cần thỏa mãn ít nhất 1 quyền)
 */
const authorize = (...requiredPermissions) => {
  return async (req, res, next) => {
    try {
      const roleCode = req.user?.roleCode || req.user?.role;
      if (!roleCode) {
        return next(new AppError('Tài khoản chưa được gán vai trò truy cập', 403));
      }

      const userPermissions = await getRolePermissions(roleCode);
      req.user.permissions = userPermissions;

      // Toàn quyền
      if (userPermissions.includes('*')) {
        return next();
      }

      // Kiểm tra khớp quyền yêu cầu
      const hasPermission = requiredPermissions.some((perm) => {
        if (userPermissions.includes(perm)) return true;
        const [moduleName] = perm.split(':');
        if (userPermissions.includes(`${moduleName}:*`)) return true;
        return false;
      });

      if (!hasPermission) {
        return next(new AppError('Bạn không có quyền thực hiện hành động này', 403));
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware phân quyền theo vai trò (Role-Based Access Control)
 * @param  {...string} roles Danh sách vai trò được phép truy cập
 */
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.roleCode || req.user?.role;
    if (!userRole || !roles.includes(userRole)) {
      return next(new AppError('Truy cập bị từ chối với vai trò hiện tại của bạn', 403));
    }
    next();
  };
};

module.exports = {
  authorize,
  authorizeRoles,
  getRolePermissions,
  invalidateRolePermissionsCache,
};

