const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Bảng thuế TNCN lũy tiến theo quy định VN.
 * Dùng để tính thuế TNCN trong Payroll. Cập nhật khi Nhà nước thay đổi.
 */
const taxBracketSchema = new Schema({
  year:    { type: Number, required: true },
  country: { type: String, default: "VN" },

  personalDeduction:  { type: Number },
  // Giảm trừ bản thân: 11.000.000 VND/tháng (2024)
  dependentDeduction: { type: Number },
  // Giảm trừ mỗi người phụ thuộc: 4.400.000 VND/tháng

  brackets: [{
    from:        { type: Number },   // Thu nhập từ (VND)
    to:          { type: Number },   // Đến (null = không giới hạn)
    rate:        { type: Number },   // Tỷ lệ thuế: 0.05, 0.10, 0.15...
    description: { type: String },  // "Bậc 1: 5% cho thu nhập 0-5 triệu"
  }],
});

module.exports = mongoose.model("TaxBracket", taxBracketSchema);
