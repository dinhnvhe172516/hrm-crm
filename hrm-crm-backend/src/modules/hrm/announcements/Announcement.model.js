const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Thông báo chung từ HR/Admin đến toàn công ty hoặc nhóm cụ thể.
 * Khác Notification: Announcement là nội dung dài, có thể pin, lên lịch đăng.
 */
const announcementSchema = new Schema({
  title:   { type: String, required: true },
  content: { type: String, required: true },
  attachments: [{ type: Schema.Types.ObjectId, ref: "FileUpload" }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

  targetType: { type: String, enum: ["all","department","group","specific_users"], default: "all" },
  targetDepartments: [{ type: Schema.Types.ObjectId, ref: "Department" }],
  targetGroups:      [{ type: Schema.Types.ObjectId, ref: "Group" }],
  targetUsers:       [{ type: Schema.Types.ObjectId, ref: "User" }],

  isPinned:    { type: Boolean, default: false },
  isImportant: { type: Boolean, default: false },
  scheduledAt: { type: Date },   // Lên lịch đăng
  expiredAt:   { type: Date },   // Tự ẩn sau ngày này

  readBy: [{
    userId: { type: Schema.Types.ObjectId, ref: "User" },
    readAt: { type: Date },
  }],
  status: { type: String, enum: ["draft","scheduled","published","archived"], default: "draft" },
  publishedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("Announcement", announcementSchema);
