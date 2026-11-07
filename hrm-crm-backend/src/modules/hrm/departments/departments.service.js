'use strict';

const Department = require('../../../shared/models/Department.model');
const User       = require('../../../shared/models/User.model');
const Position   = require('../../../shared/models/Position.model');
const { AppError } = require('../../../middlewares/error.middleware');
const logger     = require('../../../shared/utils/logger');

const departmentsService = {
  /**
   * Lấy danh sách phòng ban (kèm phân trang, tìm kiếm, lọc và đếm số lượng nhân sự)
   */
  getAll: async ({ skip = 0, limit = 50, query = {} }) => {
    const filter = {};

    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { name: searchRegex },
        { code: searchRegex },
        { location: searchRegex },
      ];
    }

    if (query.parentId !== undefined) {
      filter.parentId = query.parentId === 'null' || query.parentId === '' ? null : query.parentId;
    }

    if (query.isActive !== undefined) {
      filter.isActive = query.isActive === 'true' || query.isActive === true;
    }

    const [departments, total] = await Promise.all([
      Department.find(filter)
        .populate('managerId', 'fullName email avatar employeeCode phone')
        .populate('parentId', 'name code')
        .sort({ order: 1, createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      Department.countDocuments(filter),
    ]);

    // Thống kê số lượng nhân viên và số vị trí chức danh cho từng phòng ban
    const deptIds = departments.map((d) => d._id);
    const [userCounts, positionCounts] = await Promise.all([
      User.aggregate([
        { $match: { department: { $in: deptIds }, isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
      Position.aggregate([
        { $match: { department: { $in: deptIds }, isActive: true } },
        { $group: { _id: '$department', count: { $sum: 1 } } },
      ]),
    ]);

    const userCountMap = new Map(userCounts.map((u) => [u._id.toString(), u.count]));
    const posCountMap  = new Map(positionCounts.map((p) => [p._id.toString(), p.count]));

    const enriched = departments.map((dept) => ({
      ...dept,
      employeeCount: userCountMap.get(dept._id.toString()) || 0,
      positionCount: posCountMap.get(dept._id.toString()) || 0,
    }));

    return { data: enriched, total };
  },

  /**
   * Lấy cây cơ cấu tổ chức (Org Tree)
   */
  getTree: async () => {
    const allDepartments = await Department.find({ isActive: true })
      .populate('managerId', 'fullName email avatar employeeCode phone')
      .sort({ order: 1, name: 1 })
      .lean();

    const userCounts = await User.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$department', count: { $sum: 1 } } },
    ]);
    const userCountMap = new Map(userCounts.filter((u) => u._id).map((u) => [u._id.toString(), u.count]));

    const deptMap = new Map();
    allDepartments.forEach((dept) => {
      deptMap.set(dept._id.toString(), {
        ...dept,
        employeeCount: userCountMap.get(dept._id.toString()) || 0,
        children: [],
      });
    });

    const rootNodes = [];
    deptMap.forEach((dept) => {
      if (dept.parentId && deptMap.has(dept.parentId.toString())) {
        deptMap.get(dept.parentId.toString()).children.push(dept);
      } else {
        rootNodes.push(dept);
      }
    });

    return rootNodes;
  },

  /**
   * Lấy chi tiết phòng ban theo ID (kèm danh sách vị trí chức danh trực thuộc)
   */
  getById: async (id) => {
    const department = await Department.findById(id)
      .populate('managerId', 'fullName email avatar employeeCode phone')
      .populate('parentId', 'name code')
      .lean();

    if (!department) throw new AppError('Phòng ban không tồn tại', 404);

    const [positions, employees] = await Promise.all([
      Position.find({ department: id, isActive: true }).select('title code level').lean(),
      User.find({ department: id, isActive: true })
        .select('fullName email avatar employeeCode position phone')
        .populate('position', 'title code')
        .limit(20)
        .lean(),
    ]);

    const employeeCount = await User.countDocuments({ department: id, isActive: true });

    return {
      ...department,
      employeeCount,
      positions,
      employees,
    };
  },

  /**
   * Tạo mới phòng ban
   */
  create: async (data, user) => {
    const { name, code, description, managerId, parentId, budget, location, email, order } = data;

    if (!name || !code) {
      throw new AppError('Tên và mã phòng ban là bắt buộc', 400);
    }

    const normalizedCode = code.trim().toUpperCase();
    const existing = await Department.findOne({ code: normalizedCode });
    if (existing) {
      throw new AppError(`Mã phòng ban "${normalizedCode}" đã tồn tại trên hệ thống`, 409);
    }

    if (parentId) {
      const parent = await Department.findById(parentId);
      if (!parent) throw new AppError('Phòng ban cha không tồn tại', 404);
    }

    if (managerId) {
      const manager = await User.findById(managerId);
      if (!manager) throw new AppError('Trưởng phòng được chỉ định không tồn tại', 404);
    }

    const newDept = await Department.create({
      name:        name.trim(),
      code:        normalizedCode,
      description: description?.trim(),
      managerId:   managerId || null,
      parentId:    parentId || null,
      budget:      budget || { monthly: 0, yearly: 0, currency: 'VND' },
      location:    location?.trim(),
      email:       email?.trim(),
      order:       Number(order) || 0,
      isActive:    true,
    });

    logger.info(`Department created: ${newDept.code} by ${user?.email || user?.userId}`);
    return newDept;
  },

  /**
   * Cập nhật thông tin phòng ban
   */
  update: async (id, data, user) => {
    const dept = await Department.findById(id);
    if (!dept) throw new AppError('Phòng ban không tồn tại', 404);

    const { name, code, description, managerId, parentId, budget, location, email, order, isActive } = data;

    if (code) {
      const normalizedCode = code.trim().toUpperCase();
      if (normalizedCode !== dept.code) {
        const existing = await Department.findOne({ code: normalizedCode, _id: { $ne: id } });
        if (existing) throw new AppError(`Mã phòng ban "${normalizedCode}" đã được sử dụng`, 409);
        dept.code = normalizedCode;
      }
    }

    if (parentId !== undefined) {
      if (parentId === id) {
        throw new AppError('Phòng ban không thể làm phòng ban cha của chính nó', 400);
      }
      if (parentId) {
        // Kiểm tra phòng ban cha có tồn tại không
        const parent = await Department.findById(parentId);
        if (!parent) throw new AppError('Phòng ban cha không tồn tại', 404);

        // Ngăn chặn vòng lặp cha-con lồng nhau
        let currentParent = parent;
        while (currentParent && currentParent.parentId) {
          if (currentParent.parentId.toString() === id.toString()) {
            throw new AppError('Không thể gán phòng ban cấp con làm phòng ban cha (vòng lặp phân cấp)', 400);
          }
          currentParent = await Department.findById(currentParent.parentId);
        }
      }
      dept.parentId = parentId || null;
    }

    if (name) dept.name = name.trim();
    if (description !== undefined) dept.description = description?.trim();
    if (managerId !== undefined) dept.managerId = managerId || null;
    if (budget) dept.budget = { ...dept.budget, ...budget };
    if (location !== undefined) dept.location = location?.trim();
    if (email !== undefined) dept.email = email?.trim();
    if (order !== undefined) dept.order = Number(order);
    if (isActive !== undefined) dept.isActive = Boolean(isActive);

    await dept.save();
    logger.info(`Department updated: ${dept.code} by ${user?.email || user?.userId}`);

    return dept;
  },

  /**
   * Xóa phòng ban (kiểm tra ràng buộc an toàn)
   */
  remove: async (id, user) => {
    const dept = await Department.findById(id);
    if (!dept) throw new AppError('Phòng ban không tồn tại', 404);

    // Kiểm tra có phòng ban con không
    const childCount = await Department.countDocuments({ parentId: id, isActive: true });
    if (childCount > 0) {
      throw new AppError(`Không thể xóa phòng ban đang có ${childCount} phòng ban con. Hãy chuyển hoặc xóa các phòng ban con trước.`, 400);
    }

    // Kiểm tra có nhân sự trực thuộc không
    const employeeCount = await User.countDocuments({ department: id, isActive: true });
    if (employeeCount > 0) {
      throw new AppError(`Không thể xóa phòng ban đang có ${employeeCount} nhân sự trực thuộc. Vui lòng điều chuyển nhân sự sang phòng ban khác.`, 400);
    }

    // Xóa mềm: đánh dấu isActive = false
    dept.isActive = false;
    await dept.save();

    logger.info(`Department deactivated/deleted: ${dept.code} by ${user?.email || user?.userId}`);
    return { message: 'Đã xóa phòng ban thành công' };
  },
};

module.exports = departmentsService;
