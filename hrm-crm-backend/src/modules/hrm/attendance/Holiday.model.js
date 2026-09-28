const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Định nghĩa ngày lễ, ngày nghỉ chính thức.
 * Dùng để: đánh dấu attendance status=holiday | tính OT ngày lễ (x3)
 * Quan hệ: tham chiếu bởi Attendance
 */
const holidaySchema = new Schema({
  name:        { type: String, required: true },
  startDate:   { type: Date, required: true },
  endDate:     { type: Date, required: true },
  totalDays:   { type: Number },
  type:        { type: String, enum: ["national","company","regional"], default: "national" },
  isRecurring: { type: Boolean, default: false },
  // true = lặp lại hàng năm (Tết, 30/4...). false = chỉ năm này.
  description: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Holiday", holidaySchema);
