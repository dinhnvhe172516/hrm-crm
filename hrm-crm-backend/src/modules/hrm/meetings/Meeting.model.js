const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Quản lý cuộc họp nội bộ + tích hợp Google Meet.
 * Tự động tạo Meet link qua Google Calendar API.
 * Quan hệ: tổ chức bởi User | mời User/Department/Group | liên kết Task
 */
const meetingSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String },
  agenda:      { type: String },
  organizer:   { type: Schema.Types.ObjectId, ref: "User", required: true },

  startTime: { type: Date, required: true },
  endTime:   { type: Date, required: true },
  timezone:  { type: String, default: "Asia/Ho_Chi_Minh" },
  type:      { type: String, enum: ["online","offline","hybrid"], default: "online" },
  location:  { type: String },
  // "Phòng họp A" nếu offline/hybrid

  // ─── Google Calendar / Meet ─────────────────────────────────────────────
  googleEventId:   { type: String },
  // ID event trên Google Calendar. Dùng để update/cancel
  googleCalendarId:{ type: String },
  meetLink:        { type: String },
  // "https://meet.google.com/abc-def-ghi" — auto tạo từ Google API
  calendarLink:    { type: String },
  // Link thêm vào Google Calendar cá nhân

  // ─── Người tham dự ──────────────────────────────────────────────────────
  attendees: [{
    userId:     { type: Schema.Types.ObjectId, ref: "User" },
    status:     { type: String, enum: ["invited","accepted","declined","tentative","no_response"], default: "invited" },
    isRequired: { type: Boolean, default: true },
    respondedAt:{ type: Date },
    joinedAt:   { type: Date },
    // Thời điểm thực tế bấm link vào Meet
  }],
  invitedDepartments: [{ type: Schema.Types.ObjectId, ref: "Department" }],
  invitedGroups:      [{ type: Schema.Types.ObjectId, ref: "Group" }],

  reminders: [{
    minutesBefore: { type: Number },   // 15, 30, 60, 1440 (1 ngày)
    channel:       { type: String, enum: ["email","inapp","both"] },
    isSent:        { type: Boolean, default: false },
  }],

  recurrence: {
    isRecurring:   { type: Boolean, default: false },
    frequency:     { type: String, enum: ["daily","weekly","monthly"] },
    interval:      { type: Number, default: 1 },
    endDate:       { type: Date },
    parentMeetingId:{ type: Schema.Types.ObjectId, ref: "Meeting" },
  },

  relatedTask: { type: Schema.Types.ObjectId, ref: "Task" },
  status:      { type: String, enum: ["scheduled","ongoing","done","cancelled"], default: "scheduled" },
  cancelReason:{ type: String },
}, { timestamps: true });

meetingSchema.index({ organizer: 1, startTime: -1 });
meetingSchema.index({ "attendees.userId": 1 });

module.exports = mongoose.model("Meeting", meetingSchema);
