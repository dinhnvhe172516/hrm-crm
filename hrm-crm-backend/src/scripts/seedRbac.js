'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Permission = require('../shared/models/Permission.model');
const Role = require('../shared/models/Role.model');
const User = require('../shared/models/User.model');
const Department = require('../shared/models/Department.model');
const Position = require('../shared/models/Position.model');
const UserCredential = require('../modules/hrm/auth/UserCredential.model');
const logger = require('../shared/utils/logger');

const ALL_MODULES = [
  // HRM
  'employee', 'department', 'group', 'attendance', 'leave', 'payroll',
  'task', 'meeting', 'notification', 'announcement', 'document',
  'performance', 'training', 'recruitment', 'report', 'system',
  // CRM
  'crm_company', 'crm_contact', 'crm_lead', 'crm_opportunity',
  'crm_activity', 'crm_product', 'crm_quotation', 'crm_contract',
  'crm_invoice', 'crm_campaign', 'crm_commission', 'crm_ticket',
];

const ALL_ACTIONS = ['read', 'create', 'update', 'delete', 'approve', 'reject', 'export', 'import'];

const seedRbac = async (isStandalone = true) => {
  try {
    logger.info('🚀 Bắt đầu quá trình Seeding RBAC & Dữ liệu Nhân sự Mẫu...');
    if (mongoose.connection.readyState !== 1) {
      await connectDB();
    }

    // ── 1. Tạo danh sách Permissions ──────────────────────────────────────────
    logger.info('📦 Khởi tạo danh mục Permissions...');
    const permissionsMap = new Map();

    for (const mod of ALL_MODULES) {
      for (const action of ALL_ACTIONS) {
        const code = `${mod}:${action}`;
        const name = `${action.toUpperCase()} ${mod.toUpperCase()}`;
        const perm = await Permission.findOneAndUpdate(
          { code },
          {
            name,
            code,
            module: mod,
            action,
            description: `Cho phép thực hiện ${action} trên module ${mod}`,
            isSystem: true,
          },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        permissionsMap.set(code, perm._id);
      }
    }
    logger.info(`✅ Đã khởi tạo/cập nhật ${permissionsMap.size} permissions thành công.`);

    // Helper lọc IDs theo predicate
    const getPermIds = (matcher) => {
      const ids = [];
      for (const [code, id] of permissionsMap.entries()) {
        if (matcher(code)) ids.push(id);
      }
      return ids;
    };

    // ── 2. Tạo các Roles mặc định ─────────────────────────────────────────────
    logger.info('👥 Khởi tạo các Vai trò (Roles) mặc định...');

    const hrmModules = [
      'employee', 'department', 'group', 'attendance', 'leave', 'payroll',
      'task', 'meeting', 'notification', 'announcement', 'document',
      'performance', 'training', 'recruitment', 'report',
    ];

    const crmModules = [
      'crm_company', 'crm_contact', 'crm_lead', 'crm_opportunity',
      'crm_activity', 'crm_product', 'crm_quotation', 'crm_contract',
      'crm_invoice', 'crm_campaign', 'crm_commission', 'crm_ticket', 'report',
    ];

    const rolesConfig = [
      {
        code: 'super_admin',
        name: 'Super Administrator',
        description: 'Toàn quyền quản trị hệ thống',
        level: 1,
        isSystem: true,
        permissions: Array.from(permissionsMap.values()),
      },
      {
        code: 'hr_manager',
        name: 'HR Manager',
        description: 'Trưởng phòng nhân sự - Quản lý toàn bộ phân hệ HRM',
        level: 2,
        isSystem: true,
        permissions: getPermIds((code) => hrmModules.some((m) => code.startsWith(`${m}:`))),
      },
      {
        code: 'crm_manager',
        name: 'CRM Manager',
        description: 'Trưởng phòng kinh doanh - Quản lý toàn bộ phân hệ CRM',
        level: 2,
        isSystem: true,
        permissions: getPermIds((code) => crmModules.some((m) => code.startsWith(`${m}:`))),
      },
      {
        code: 'department_manager',
        name: 'Trưởng phòng ban',
        description: 'Quản lý nhân sự và duyệt đơn từ thuộc phòng ban quản lý',
        level: 3,
        isSystem: true,
        permissions: getPermIds((code) =>
          [
            'employee:read',
            'department:read',
            'attendance:read',
            'attendance:approve',
            'attendance:reject',
            'leave:read',
            'leave:approve',
            'leave:reject',
            'task:read',
            'task:create',
            'task:update',
            'task:delete',
            'meeting:read',
            'meeting:create',
            'meeting:update',
            'performance:read',
            'performance:create',
            'document:read',
            'announcement:read',
            'notification:read',
          ].includes(code)
        ),
      },
      {
        code: 'employee',
        name: 'Nhân viên',
        description: 'Nhân viên thông thường - Tự phục vụ các tác vụ cá nhân',
        level: 4,
        isSystem: true,
        permissions: getPermIds((code) =>
          [
            'attendance:create',
            'attendance:read',
            'leave:create',
            'leave:read',
            'task:read',
            'task:update',
            'meeting:read',
            'document:read',
            'announcement:read',
            'notification:read',
          ].includes(code)
        ),
      },
    ];

    const createdRoles = {};
    for (const r of rolesConfig) {
      const roleDoc = await Role.findOneAndUpdate(
        { code: r.code },
        r,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdRoles[r.code] = roleDoc;
      logger.info(`  - Role [${roleDoc.code}] gán ${roleDoc.permissions.length} quyền.`);
    }

    // ── 3. Khởi tạo Cơ cấu Phòng ban Mẫu (Departments) ────────────────────────
    logger.info('🏢 Khởi tạo Phòng ban mẫu...');
    const departmentsData = [
      { code: 'BOD',  name: 'Ban Giám Đốc',             description: 'Bộ máy lãnh đạo và điều hành công ty' },
      { code: 'HR',   name: 'Phòng Nhân Sự',            description: 'Quản lý tuyển dụng, chế độ, tiền lương và đào tạo' },
      { code: 'SALE', name: 'Phòng Kinh Doanh',         description: 'Phát triển thị trường, tìm kiếm khách hàng và bán hàng' },
      { code: 'TECH', name: 'Phòng Công Nghệ & Kỹ Thuật', description: 'Phát triển và bảo trì hệ thống phần mềm' },
    ];

    const createdDepartments = {};
    for (const d of departmentsData) {
      const depDoc = await Department.findOneAndUpdate(
        { code: d.code },
        d,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdDepartments[d.code] = depDoc;
    }

    // ── 4. Khởi tạo Chức danh / Vị trí Công việc (Positions) ──────────────────
    logger.info('💼 Khởi tạo Vị trí / Chức danh công việc mẫu...');
    const positionsData = [
      { code: 'CEO',        title: 'Tổng Giám Đốc',            department: createdDepartments['BOD']._id,  level: 1 },
      { code: 'HR_MGR',     title: 'Trưởng Phòng Nhân Sự',      department: createdDepartments['HR']._id,   level: 4 },
      { code: 'SALES_LEAD', title: 'Trưởng Phòng Kinh Doanh',   department: createdDepartments['SALE']._id, level: 4 },
      { code: 'SALES_REP',  title: 'Chuyên Viên Bán Hàng',      department: createdDepartments['SALE']._id, level: 2 },
      { code: 'TECH_LEAD',  title: 'Trưởng Phòng Công Nghệ',    department: createdDepartments['TECH']._id, level: 4 },
    ];

    const createdPositions = {};
    for (const p of positionsData) {
      const posDoc = await Position.findOneAndUpdate(
        { code: p.code },
        p,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      createdPositions[p.code] = posDoc;
    }

    // ── 5. Khởi tạo Danh sách Tài khoản Nhân sự Mẫu (Khớp 100% Login Frontend) ─
    logger.info('👤 Khởi tạo tài khoản nhân sự mẫu (Khớp nút 1-Click trên Login)...');

    const sampleUsers = [
      {
        email: 'admin@nexus-corp.com',
        fullName: 'Quản Trị Viên Hệ Thống',
        employeeCode: 'ADMIN001',
        roleCode: 'super_admin',
        deptCode: 'BOD',
        posCode: 'CEO',
        phone: '0909000001',
        gender: 'male',
        password: 'Password@123',
      },
      {
        email: 'admin@hrm-crm.local',
        fullName: 'Super Admin (Local)',
        employeeCode: 'ADMIN000',
        roleCode: 'super_admin',
        deptCode: 'BOD',
        posCode: 'CEO',
        phone: '0909000000',
        gender: 'male',
        password: 'Password@123',
      },
      {
        email: 'linh.nguyen@nexus-corp.com',
        fullName: 'Nguyễn Thị Thùy Linh',
        employeeCode: 'NV001',
        roleCode: 'hr_manager',
        deptCode: 'HR',
        posCode: 'HR_MGR',
        phone: '0901234567',
        gender: 'female',
        password: 'Password@123',
      },
      {
        email: 'minh.tran@nexus-corp.com',
        fullName: 'Trần Quang Minh',
        employeeCode: 'NV002',
        roleCode: 'crm_manager',
        deptCode: 'SALE',
        posCode: 'SALES_LEAD',
        phone: '0912345678',
        gender: 'male',
        password: 'Password@123',
      },
      {
        email: 'hoa.pham@nexus-corp.com',
        fullName: 'Phạm Mai Hoa',
        employeeCode: 'NV003',
        roleCode: 'employee',
        deptCode: 'SALE',
        posCode: 'SALES_REP',
        phone: '0987654321',
        gender: 'female',
        password: 'Password@123',
      },
      {
        email: 'dung.le@nexus-corp.com',
        fullName: 'Lê Tuấn Dũng',
        employeeCode: 'NV004',
        roleCode: 'department_manager',
        deptCode: 'TECH',
        posCode: 'TECH_LEAD',
        phone: '0934567890',
        gender: 'male',
        password: 'Password@123',
      },
    ];

    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;

    for (const u of sampleUsers) {
      const role = createdRoles[u.roleCode];
      const department = createdDepartments[u.deptCode];
      const position = createdPositions[u.posCode];

      let user = await User.findOne({ email: u.email });
      if (!user) {
        user = await User.findOne({ employeeCode: u.employeeCode });
      }

      if (!user) {
        user = await User.create({
          fullName: u.fullName,
          email: u.email,
          employeeCode: u.employeeCode,
          phone: u.phone,
          gender: u.gender,
          department: department?._id,
          position: position?._id,
          role: role?._id,
          isEmailVerified: true,
          isActive: true,
          status: 'official',
        });
      } else {
        user.fullName = u.fullName;
        user.email = u.email;
        user.employeeCode = u.employeeCode;
        user.role = role?._id;
        user.department = department?._id;
        user.position = position?._id;
        user.phone = u.phone;
        user.isActive = true;
        user.failedLoginAttempts = 0;
        user.lockUntil = null;
        await user.save();
      }

      // Tạo/Cập nhật UserCredential (Mật khẩu: Password@123)
      const passwordHash = await bcrypt.hash(u.password, saltRounds);
      await UserCredential.findOneAndUpdate(
        { userId: user._id },
        {
          userId: user._id,
          passwordHash,
          mustChangePassword: false,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      logger.info(
        `  ✅ [${u.employeeCode}] ${u.fullName} (${u.email}) - Vai trò: ${u.roleCode} - Pass: ${u.password}`
      );
    }

    logger.info('🎉 HOÀN TẤT SEEDING TOÀN BỘ TÀI KHOẢN NHÂN SỰ & RBAC!');
    if (isStandalone) {
      await mongoose.disconnect();
      process.exit(0);
    }
  } catch (error) {
    logger.error('❌ Lỗi Seeding RBAC & Nhân sự:', error);
    if (isStandalone) {
      process.exit(1);
    }
    throw error;
  }
};

if (require.main === module) {
  seedRbac(true);
}

module.exports = { seedRbac };
