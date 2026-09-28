const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Lưu tỷ lệ đóng BHXH/BHYT/BHTN theo từng năm.
 * Cập nhật khi Nhà nước điều chỉnh. Dùng trong tính lương.
 */
const insuranceRateSchema = new Schema({
  year:          { type: Number, required: true, unique: true },
  effectiveDate: { type: Date },
  employee: {
    bhxh: { type: Number, default: 0.08   },   // 8%
    bhyt: { type: Number, default: 0.015  },   // 1.5%
    bhtn: { type: Number, default: 0.01   },   // 1%
  },
  employer: {
    bhxh:      { type: Number, default: 0.175  },  // 17.5%
    bhyt:      { type: Number, default: 0.03   },  // 3%
    bhtn:      { type: Number, default: 0.01   },  // 1%
    bhtnld_bnn:{ type: Number, default: 0.005  },  // 0.5% tai nạn lao động
  },
  salaryCapBhxh: { type: Number },
  // Mức trần lương đóng BHXH: 36.000.000 VND/tháng
  note: { type: String },
});

module.exports = mongoose.model("InsuranceRate", insuranceRateSchema);
