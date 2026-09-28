const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Cấu hình hệ thống theo key-value. Quản lý tham số toàn cục.
 */
const systemSettingSchema = new Schema({
  key:         { type: String, required: true, unique: true },
  value:       { type: Schema.Types.Mixed },
  type:        { type: String, enum: ["string","number","boolean","json"] },
  group:       { type: String, enum: ["company","payroll","attendance","security","email"] },
  label:       { type: String },
  description: { type: String },
  isPublic:    { type: Boolean, default: false },
  updatedBy:   { type: Schema.Types.ObjectId, ref: "User" },
  updatedAt:   { type: Date },
});
module.exports = mongoose.model("SystemSetting", systemSettingSchema);
