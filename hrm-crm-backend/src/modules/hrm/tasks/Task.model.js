const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Giao và quản lý công việc giữa các phòng ban/cá nhân.
 * Hỗ trợ: subtask, attachment, comment (TaskComment), time log (TaskTimeLog).
 * Quan hệ: tạo bởi User | giao cho User/Department/Group | theo dõi bởi nhiều User
 */
const taskSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String },
  // Mô tả chi tiết, hỗ trợ Markdown
  category:    { type: Schema.Types.ObjectId, ref: "TaskCategory" },

  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },

  // ─── Giao cho (chọn 1 trong 3 kiểu) ────────────────────────────────────
  assignedToUsers:      [{ type: Schema.Types.ObjectId, ref: "User" }],
  assignedToDepartment: { type: Schema.Types.ObjectId, ref: "Department" },
  assignedToGroup:      { type: Schema.Types.ObjectId, ref: "Group" },

  watchers: [{ type: Schema.Types.ObjectId, ref: "User" }],
  // → Người theo dõi: nhận thông báo nhưng không thực hiện

  priority: { type: String, enum: ["low","medium","high","urgent"], default: "medium" },
  status:   { type: String, enum: ["todo","in_progress","review","done","cancelled"], default: "todo" },

  startDate:   { type: Date },
  dueDate:     { type: Date },
  completedAt: { type: Date },

  progress:       { type: Number, min: 0, max: 100, default: 0 },
  estimatedHours: { type: Number },
  actualHours:    { type: Number, default: 0 },

  parentTask: { type: Schema.Types.ObjectId, ref: "Task" },
  // → Task cha (để tạo subtask). null = task gốc

  tags:        [{ type: String }],
  attachments: [{ type: Schema.Types.ObjectId, ref: "FileUpload" }],
}, { timestamps: true });

taskSchema.index({ assignedToUsers: 1, status: 1 });
taskSchema.index({ dueDate: 1, status: 1 });
taskSchema.index({ createdBy: 1 });

module.exports = mongoose.model("Task", taskSchema);
