const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Nhân viên đăng ký làm việc từ xa (WFH) → cần duyệt.
 * Sau khi duyệt → Attendance ghi status=wfh.
 * Quan hệ: thuộc 1 User | duyệt bởi 1 User (Manager)
 */
const wfhRequestSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  dates:    [{ type: Date }],
  // Có thể đăng ký nhiều ngày WFH trong 1 request
  reason:   { type: String, required: true },

  status:       { type: String, enum: ["pending","approved","rejected"], default: "pending" },
  approvedBy:   { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt:   { type: Date },
  rejectReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("WFHRequest", wfhRequestSchema);
