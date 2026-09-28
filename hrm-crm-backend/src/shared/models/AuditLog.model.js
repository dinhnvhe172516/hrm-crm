const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Ghi lại mọi thao tác thay đổi dữ liệu quan trọng. Security audit trail.
 */
const auditLogSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: "User", index: true },
  userEmail:   { type: String },
  action:      { type: String, enum: ["CREATE","UPDATE","DELETE","APPROVE","REJECT","EXPORT","LOGIN","LOGOUT"] },
  module:      { type: String },
  targetId:    { type: Schema.Types.ObjectId },
  targetModel: { type: String },
  description: { type: String },
  before:      { type: Schema.Types.Mixed },
  after:       { type: Schema.Types.Mixed },
  changes:     [{ type: String }],
  ipAddress:   { type: String },
  userAgent:   { type: String },
}, { timestamps: true });
auditLogSchema.index({ userId: 1, createdAt: -1 });
module.exports = mongoose.model("AuditLog", auditLogSchema);
