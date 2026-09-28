const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Định nghĩa ca làm việc (giờ bắt đầu, kết thúc, ngày làm).
 * Là nền tảng để tính đi muộn/về sớm trong Attendance.
 * Quan hệ: 1 WorkShift gán cho nhiều User | được tham chiếu bởi Attendance
 */
const workShiftSchema = new Schema({
  name:           { type: String, required: true },
  code:           { type: String, unique: true },
  startTime:      { type: String, required: true },  // "08:00"
  endTime:        { type: String, required: true },  // "17:00"
  breakStartTime: { type: String },  // "12:00"
  breakEndTime:   { type: String },  // "13:00"
  breakMinutes:   { type: Number, default: 60 },
  workDays: [{
    type: String,
    enum: ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"],
  }],
  // Ngày làm việc trong tuần
  isDefault: { type: Boolean, default: false },
  // true = ca mặc định khi tạo nhân viên mới
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("WorkShift", workShiftSchema);
