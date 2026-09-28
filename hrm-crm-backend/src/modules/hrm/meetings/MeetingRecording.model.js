const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Lưu link recording cuộc họp (Google Drive, S3...).
 */
const meetingRecordingSchema = new Schema({
  meetingId:    { type: Schema.Types.ObjectId, ref: "Meeting", required: true },
  recordingUrl: { type: String },
  duration:     { type: Number },   // Phút
  fileSize:     { type: Number },   // Bytes
  accessType:   { type: String, enum: ["all_attendees","organizer_only","specific"] },
  uploadedBy:   { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("MeetingRecording", meetingRecordingSchema);
