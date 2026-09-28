const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Định nghĩa chức vụ/vị trí công việc trong công ty.
 * Quan hệ: 1 Position thuộc 1 Department (hoặc dùng chung) | 1 Position có 1 SalaryGrade
 *          1 Position có nhiều User
 */
const positionSchema = new Schema({
  title:       { type: String, required: true },
  // "Senior Backend Developer", "HR Manager", "Sales Lead"
  code:        { type: String, unique: true, sparse: true },
  department:  { type: Schema.Types.ObjectId, ref: "Department" },
  // null = vị trí dùng chung cho nhiều phòng ban
  salaryGrade: { type: Schema.Types.ObjectId, ref: "SalaryGrade" },
  // → Bậc lương tương ứng
  level:       { type: Number },
  // Cấp bậc số: 1=Junior, 2=Mid, 3=Senior, 4=Lead, 5=Manager
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Position", positionSchema);
