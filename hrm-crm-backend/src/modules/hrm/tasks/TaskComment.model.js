const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Comment trên task. Tách riêng để không làm phình Task document.
 * Hỗ trợ @mention, đính kèm file, chỉnh sửa.
 */
const taskCommentSchema = new Schema({
  taskId:      { type: Schema.Types.ObjectId, ref: "Task", required: true, index: true },
  userId:      { type: Schema.Types.ObjectId, ref: "User", required: true },
  content:     { type: String, required: true },
  mentions:    [{ type: Schema.Types.ObjectId, ref: "User" }],
  attachments: [{ type: Schema.Types.ObjectId, ref: "FileUpload" }],
  isEdited:    { type: Boolean, default: false },
  editedAt:    { type: Date },
}, { timestamps: true });
module.exports = mongoose.model("TaskComment", taskCommentSchema);
