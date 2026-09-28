const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Quản lý cơ cấu phòng ban công ty.
 * Hỗ trợ phân cấp (phòng ban con) qua parentId.
 * Quan hệ: 1 Department có nhiều User | 1 Department có nhiều Group
 *          1 Department có thể có Department cha (self-reference)
 */
const departmentSchema = new Schema({
  name:        { type: String, required: true, trim: true },
  code:        { type: String, required: true, unique: true, uppercase: true },
  // Mã phòng ban: "MKT", "ENG", "HR", "SALE"
  description: { type: String },

  managerId: { type: Schema.Types.ObjectId, ref: "User" },
  // → Trưởng phòng (1 User)
  parentId:  { type: Schema.Types.ObjectId, ref: "Department" },
  // → Phòng ban cha (null = phòng ban cấp cao nhất). Self-reference cho cây phòng ban.

  budget: {
    monthly:  { type: Number, default: 0 },
    yearly:   { type: Number, default: 0 },
    currency: { type: String, default: "VND" },
    // Ngân sách hoạt động của phòng ban
  },
  location: { type: String },
  // "Tầng 3 - Toà nhà ABC" hoặc "Chi nhánh Hà Nội"
  email:    { type: String },
  // Email phòng ban (nếu có)

  isActive: { type: Boolean, default: true },
  order:    { type: Number, default: 0 },
  // Thứ tự hiển thị trong org chart
}, { timestamps: true });

module.exports = mongoose.model("Department", departmentSchema);
