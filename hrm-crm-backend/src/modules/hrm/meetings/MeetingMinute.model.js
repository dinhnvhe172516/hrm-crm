const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Biên bản cuộc họp. Action items có thể tạo thành Task thực tế.
 */
const meetingMinuteSchema = new Schema({
  meetingId: { type: Schema.Types.ObjectId, ref: "Meeting", required: true, unique: true },
  summary:   { type: String },
  content:   { type: String },
  decisions: [{ type: String }],
  actionItems: [{
    description:{ type: String },
    assignee:   { type: Schema.Types.ObjectId, ref: "User" },
    dueDate:    { type: Date },
    status:     { type: String, enum: ["pending","in_progress","done"], default: "pending" },
    linkedTask: { type: Schema.Types.ObjectId, ref: "Task" },
    // → Task được tạo từ action item này
  }],
  attachments: [{ type: Schema.Types.ObjectId, ref: "FileUpload" }],
  writtenBy:   { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("MeetingMinute", meetingMinuteSchema);
