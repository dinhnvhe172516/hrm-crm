const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Định nghĩa các loại nghỉ phép và quy tắc cho từng loại.
 * Quan hệ: 1 LeaveType được tham chiếu bởi LeaveBalance và LeaveRequest
 */
const leaveTypeSchema = new Schema({
  name: { type: String, required: true },
  // "Nghỉ phép năm", "Nghỉ bệnh", "Nghỉ thai sản"
  code: { type: String, required: true, unique: true },
  // "annual" | "sick" | "maternity" | "paternity" | "compassionate" | "unpaid"

  maxDaysPerYear:    { type: Number },   // Tối đa bao nhiêu ngày/năm
  maxDaysPerRequest: { type: Number },   // Tối đa mỗi lần xin bao nhiêu ngày
  minNoticeDays:     { type: Number, default: 0 },
  // Phải báo trước bao nhiêu ngày. VD: phép năm cần báo trước 3 ngày.

  isPaid:           { type: Boolean, default: true },
  // false = nghỉ không lương (unpaid leave)
  canCarryOver:     { type: Boolean, default: false },
  // true = được chuyển ngày phép dư sang năm sau
  maxCarryOverDays: { type: Number, default: 0 },
  requiresDocument: { type: Boolean, default: false },
  // true = cần upload giấy tờ (VD: giấy bác sĩ cho nghỉ bệnh)
  requiresApproval: { type: Boolean, default: true },
  description:      { type: String },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("LeaveType", leaveTypeSchema);
