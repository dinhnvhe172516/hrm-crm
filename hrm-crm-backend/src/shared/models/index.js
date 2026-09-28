/**
 * SHARED MODELS INDEX
 * Export tất cả models dùng chung để import tiện hơn:
 *
 * const { User, Department, Role } = require('../../shared/models');
 */

// Auth & RBAC (dùng bởi mọi module)
const User           = require('./User.model');
const Role           = require('./Role.model');
const Permission     = require('./Permission.model');

// Organization (dùng bởi tasks, meetings, notifications, leave, performance...)
const Department     = require('./Department.model');
const Group          = require('./Group.model');
const Position       = require('./Position.model');
const SalaryGrade    = require('./SalaryGrade.model');
const AllowanceType  = require('./AllowanceType.model');

// System utilities (dùng bởi mọi module)
const FileUpload     = require('./FileUpload.model');
const AuditLog       = require('./AuditLog.model');
const SystemSetting  = require('./SystemSetting.model');

module.exports = {
  User, Role, Permission,
  Department, Group, Position, SalaryGrade, AllowanceType,
  FileUpload, AuditLog, SystemSetting,
};
