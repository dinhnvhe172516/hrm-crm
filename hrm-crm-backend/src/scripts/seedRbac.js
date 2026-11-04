'use strict';

require('dotenv').config();
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');
const { connectDB } = require('../config/database');
const Permission = require('../shared/models/Permission.model');
const Role = require('../shared/models/Role.model');
const User = require('../shared/models/User.model');
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

const seedRbac = async () => {
  try {
    logger.info('🚀 Bắt đầu quá trình Seeding RBAC & Permissions...');
    await connectDB();

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

    // Helper lọc IDs theo prefix hoặc action
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
        permissions: Array.from(permissionsMap.values()), // Tất cả quyền
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

    // ── 3. Khởi tạo tài khoản Super Admin ban đầu ──────────────────────────────
    const adminEmail = process.env.ADMIN_SEED_EMAIL || 'admin@hrm-crm.local';
    const adminPass = process.env.ADMIN_SEED_PASSWORD || 'Admin@123456';

    let adminUser = await User.findOne({ email: adminEmail });
    if (!adminUser) {
      logger.info(`👤 Đang tạo tài khoản Super Admin mặc định: ${adminEmail}...`);
      adminUser = await User.create({
        fullName: 'Super Administrator',
        email: adminEmail,
        employeeCode: 'ADMIN001',
        role: createdRoles['super_admin']._id,
        isEmailVerified: true,
        isActive: true,
        status: 'official',
      });

      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
      const passwordHash = await bcrypt.hash(adminPass, saltRounds);

      await UserCredential.create({
        userId: adminUser._id,
        passwordHash,
        mustChangePassword: false,
      });

      logger.info(`✅ Tạo Super Admin thành công!`);
      logger.info(`   👉 Email: ${adminEmail}`);
      logger.info(`   👉 Password: ${adminPass}`);
    } else {
      // Đảm bảo Super Admin luôn có đúng role super_admin
      adminUser.role = createdRoles['super_admin']._id;
      adminUser.isActive = true;
      await adminUser.save();
      logger.info(`ℹ️ Tài khoản Super Admin đã tồn tại (${adminEmail}). Đã đồng bộ vai trò.`);
    }

    logger.info('🎉 HOÀN TẤT SEEDING RBAC & TÀI KHOẢN ADMIN!');
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    logger.error('❌ Lỗi Seeding RBAC:', error);
    process.exit(1);
  }
};

seedRbac();

