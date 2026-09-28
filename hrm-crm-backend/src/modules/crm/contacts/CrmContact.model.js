const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Người liên hệ trong công ty KH. 1 công ty có nhiều người liên hệ.
 * Liên kết activity, meeting, và quotation.
 */
const crmContactSchema = new Schema({
  fullName:   { type: String, required: true },
  company:    { type: Schema.Types.ObjectId, ref: "CrmCompany", index: true },
  position:   { type: String },
  department: { type: String },
  role: { type: String, enum: ["decision_maker","influencer","user","gatekeeper","champion"] },
  email:    { type: String },
  phone:    { type: String },
  mobile:   { type: String },
  linkedin: { type: String },
  avatar:   { type: String },
  source:   { type: String, enum: ["website","referral","event","cold_call","social","email"] },
  tags:     [{ type: String }],
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  isActive:   { type: Boolean, default: true },
  note:       { type: String },
  createdBy:  { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("CrmContact", crmContactSchema);
