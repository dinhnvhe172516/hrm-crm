const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Khách hàng tiềm năng chưa được qualify.
 * Sau khi qualify → convert thành CrmOpportunity.
 * Nguồn lead (source/campaign) dùng để đo ROI marketing.
 */
const crmLeadSchema = new Schema({
  contactName: { type: String }, companyName: { type: String },
  email: { type: String }, phone: { type: String }, position: { type: String },
  contact: { type: Schema.Types.ObjectId, ref: "CrmContact" },
  company:  { type: Schema.Types.ObjectId, ref: "CrmCompany" },
  source:   { type: String, enum: ["website","facebook","google_ads","event","referral","cold_call","email","zalo","other"] },
  campaign: { type: Schema.Types.ObjectId, ref: "CrmCampaign" },
  referredBy:{ type: Schema.Types.ObjectId, ref: "User" },
  interest:  { type: String },
  budget:    { type: Number },
  score:       { type: Number, default: 0, min: 0, max: 100 },
  temperature: { type: String, enum: ["cold","warm","hot"], default: "cold" },
  assignedTo:  { type: Schema.Types.ObjectId, ref: "User" },
  status: { type: String, enum: ["new","contacted","qualified","converted","disqualified"], default: "new" },
  disqualifyReason: { type: String },
  convertedAt: { type: Date },
  opportunity: { type: Schema.Types.ObjectId, ref: "CrmOpportunity" },
  nextFollowUp:{ type: Date },
  notes:       { type: String },
  tags:        [{ type: String }],
  createdBy:   { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
crmLeadSchema.index({ status: 1, assignedTo: 1 });
module.exports = mongoose.model("CrmLead", crmLeadSchema);
