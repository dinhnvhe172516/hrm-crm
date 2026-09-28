const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Ghi lại mọi tương tác với khách hàng (gọi điện, email, gặp mặt, demo...).
 * Timeline này là nguồn sự thật về lịch sử quan hệ với từng KH.
 */
const crmActivitySchema = new Schema({
  type: { type: String, enum: ["call", "email", "meeting", "demo", "visit", "note", "task", "linkedin"], required: true },
  subject: { type: String, required: true },
  description: { type: String },
  refModel: { type: String, enum: ["CrmLead", "CrmOpportunity", "CrmContact", "CrmCompany"] },
  refId: { type: Schema.Types.ObjectId },
  contact: { type: Schema.Types.ObjectId, ref: "CrmContact" },
  company: { type: Schema.Types.ObjectId, ref: "CrmCompany" },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true },
  scheduledAt: { type: Date },
  completedAt: { type: Date },
  duration: { type: Number },
  outcome: { type: String, enum: ["interested", "not_interested", "callback", "no_answer", "meeting_set", "demo_scheduled", "proposal_sent", "deal_won", "deal_lost"] },
  nextAction: { type: String },
  nextActionDate: { type: Date },
  meetLink: { type: String },
  meetingId: { type: Schema.Types.ObjectId, ref: "Meeting" },
  isDone: { type: Boolean, default: false },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
crmActivitySchema.index({ refId: 1, refModel: 1 });
module.exports = mongoose.model("CrmActivity", crmActivitySchema);
