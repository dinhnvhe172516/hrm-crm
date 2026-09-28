const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Danh mục các loại phụ cấp.
 * Tham chiếu từ Contract.salary.allowances và Payroll.allowances.
 */
const allowanceTypeSchema = new Schema({
  name:        { type: String, required: true },   // "Phụ cấp xăng xe"
  code:        { type: String, unique: true },
  defaultAmount:{ type: Number },                  // Giá trị mặc định
  isTaxable:   { type: Boolean, default: false },
  // true = phụ cấp này tính vào thu nhập chịu thuế TNCN
  isInsurable: { type: Boolean, default: false },
  // true = tính vào lương đóng BHXH
  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("AllowanceType", allowanceTypeSchema);
