const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Thông báo inapp cho từng user. Push real-time qua Socket.io.
 * Quan hệ: thuộc 1 User (recipient) | tham chiếu entity (Task/Meeting/Leave...)
 */
const notificationSchema = new Schema({
  recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },

  type: {
    type: String,
    enum: [
      "task_assigned","task_updated","task_completed","task_overdue",
      "meeting_invite","meeting_reminder","meeting_cancelled",
      "leave_approved","leave_rejected","leave_pending",
      "payslip","bonus","overtime_approved",
      "announcement","contract_expiring","birthday","system"
    ],
  },
  title:   { type: String, required: true },
  body:    { type: String },
  link:    { type: String },   // "/tasks/abc123" — URL click vào
  icon:    { type: String },   // "task" | "meeting" | "leave" (icon hiển thị)

  refModel:{ type: String },   // "Task" | "Meeting" | "LeaveRequest"
  refId:   { type: Schema.Types.ObjectId },
  // → Entity liên quan. Không dùng populate trực tiếp vì refModel khác nhau.

  isRead:  { type: Boolean, default: false, index: true },
  readAt:  { type: Date },
  expiresAt:{ type: Date },
  // Notification tự ẩn sau ngày này (nếu không đọc)
}, { timestamps: true });

notificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Notification", notificationSchema);
