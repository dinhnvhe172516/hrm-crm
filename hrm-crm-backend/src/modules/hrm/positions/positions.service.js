'use strict';

const Position   = require('../../../shared/models/Position.model');
const Department = require('../../../shared/models/Department.model');
const User       = require('../../../shared/models/User.model');
const { AppError } = require('../../../middlewares/error.middleware');
const logger     = require('../../../shared/utils/logger');

const positionsService = {
  /**
   * Lấy danh sách vị trí chức danh (kèm phân trang, tìm kiếm, lọc theo phòng ban, cấp bậc)
   */
  getAll: async ({ skip = 0, limit = 50, query = {} }) => {
    const filter = {};

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { code:  searchRegex },
      ];
    }

    if (query.department) {
      filter.department = query.department;
    }

    if (query.level) {
      filter.level = Number(query.level);
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    }

    const [positions, total] = await Promise.all([
      Position.find(filter)
        .populate('department', 'name code')
        .sort({ level: 1, title: 1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      Position.countDocuments(filter),
    ]);

    // Đếm số lượng nhân sự giữ từng chức danh
    const posIds = positions.map((p) => p._id);
    const userCounts = await User.aggregate([
      { $match: { position: { $in: posIds }, isActive: true } },
      { $group: { _id: '$position', count: { $sum: 1 } } },
    ]);
    const userCountMap = new Map(userCounts.map((u) => [u._id.toString(), u.count]));

    const enriched = positions.map((pos) => ({
      ...pos,
      employeeCount: userCountMap.get(pos._id.toString()) || 0,
    }));

    return { data: enriched, total };
  },

  /**
   * Lấy chi tiết chức danh
   */
  getById: async (id) => {
    const pos = await Position.findById(id)
      .populate('department', 'name code')
      .lean();

    if (!pos) throw new AppError('Chức danh không tồn tại', 404);

    const employeeCount = await User.countDocuments({ position: id, isActive: true });
    return { ...pos, employeeCount };
  },

  /**
   * Tạo mới vị trí chức danh
   */
  create: async (data, user) => {
    const { title, code, department, level, description } = data;

    if (!title) throw new AppError('Tên chức danh là bắt buộc', 400);

    let normalizedCode = code ? code.trim().toUpperCase() : null;
    if (normalizedCode) {
      const existing = await Position.findOne({ code: normalizedCode });
      if (existing) throw new AppError(`Mã chức vụ "${normalizedCode}" đã tồn tại`, 409);
    }

    if (department) {
      const deptExists = await Department.findById(department);
      if (!deptExists) throw new AppError('Phòng ban chỉ định không tồn tại', 404);
    }

    const pos = await Position.create({
      title:       title.trim(),
      code:        normalizedCode,
      department:  department || null,
      level:       Number(level) || 1,
      description: description?.trim(),
      isActive:    true,
    });

    logger.info(`Position created: ${pos.title} by ${user?.email || user?.userId}`);
    return pos;
  },

  /**
   * Cập nhật vị trí chức danh
   */
  update: async (id, data, user) => {
    const pos = await Position.findById(id);
    if (!pos) throw new AppError('Chức danh không tồn tại', 404);

    const { title, code, department, level, description, isActive } = data;

    if (code) {
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode !== pos.code) {
        const existing = await Position.findOne({ code: normalizedCode, _id: { $ne: id } });
        if (existing) throw new AppError(`Mã chức vụ "${normalizedCode}" đã được sử dụng`, 409);
        pos.code = normalizedCode;
      }
    }

    if (department !== undefined) {
      if (department) {
        const deptExists = await Department.findById(department);
        if (!deptExists) throw new AppError('Phòng ban chỉ định không tồn tại', 404);
      }
      pos.department = department || null;
    }

    if (title) pos.title = title.trim();
    if (level !== undefined) pos.level = Number(level);
    if (description !== undefined) pos.description = description?.trim();
    if (isActive !== undefined) pos.isActive = Boolean(isActive);

    await pos.save();
    logger.info(`Position updated: ${pos.title} by ${user?.email || user?.userId}`);
    return pos;
  },

  /**
   * Xóa chức danh (kiểm tra an toàn)
   */
  remove: async (id, user) => {
    const pos = await Position.findById(id);
    if (!pos) throw new AppError('Chức danh không tồn tại', 404);

    const userCount = await User.countDocuments({ position: id, isActive: true });
    if (userCount > 0) {
      throw new AppError(`Không thể xóa chức danh đang có ${userCount} nhân sự giữ chức vụ này.`, 400);
    }

    pos.isActive = false;
    await pos.save();

    logger.info(`Position deactivated/deleted: ${pos.title} by ${user?.email || user?.userId}`);
    return { message: 'Đã xóa chức danh thành công' };
  },
};

module.exports = positionsService;
