const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Nhân viên đăng ký làm thêm giờ (OT) → cần duyệt.
 * Sau khi duyệt → dữ liệu OT được tính vào Attendance và Payroll.
 * Quan hệ: thuộc 1 User | duyệt bởi 1 User | liên kết Task (OT vì task nào)
 */
const overtimeRequestSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date:    { type: Date, required: true },
  startTime: { type: String },  // "17:30"
  endTime:   { type: String },  // "20:00"
  hours:     { type: Number },  // Số giờ OT

  reason:      { type: String, required: true },
  relatedTask: { type: Schema.Types.ObjectId, ref: "Task" },
  // → Task gây ra việc OT (optional, để justify)

  status:       { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  approvedBy:   { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt:   { type: Date },
  rejectReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("OvertimeRequest", overtimeRequestSchema);
