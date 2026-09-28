const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Định nghĩa bậc lương (Junior/Mid/Senior/Lead).
 * Dùng để chuẩn hóa mức lương theo cấp bậc. Tham chiếu từ Position và User.
 */
const salaryGradeSchema = new Schema({
  name:          { type: String, required: true },  // "Junior", "Senior", "Lead"
  code:          { type: String, unique: true },
  level:         { type: Number },                  // 1=Junior → 5=Director
  minSalary:     { type: Number },                  // Lương tối thiểu của bậc
  maxSalary:     { type: Number },                  // Lương tối đa của bậc
  description:   { type: String },
  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("SalaryGrade", salaryGradeSchema);
