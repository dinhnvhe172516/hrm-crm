const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Định nghĩa vai trò hệ thống.
 * Mỗi User có 1 Role. Role có nhiều Permission.
 * Quan hệ: 1 Role → nhiều User | 1 Role → nhiều Permission
 */
const roleSchema = new Schema({
  name:        { type: String, required: true },
  // Tên hiển thị: "Super Admin", "HR Manager", "Manager", "Employee"
  code:        { type: String, required: true, unique: true },
  // Mã định danh: "super_admin", "hr_manager", "manager", "employee"
  description: { type: String },
  level: {
    type: Number,
    // Cấp độ phân cấp: 1=SuperAdmin (cao nhất) → 4=Employee (thấp nhất)
    // Dùng để kiểm soát: role cấp thấp không xem được data cấp cao
  },
  isSystem: { type: Boolean, default: false },
  // true = vai trò hệ thống mặc định, không thể xóa

  permissions: [{ type: Schema.Types.ObjectId, ref: "Permission" }],
  // → Danh sách quyền thuộc vai trò này
}, { timestamps: true });

module.exports = mongoose.model("Role", roleSchema);
