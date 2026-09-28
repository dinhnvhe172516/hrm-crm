const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Chiến dịch marketing. Theo dõi nguồn lead và đo ROI.
 */
const crmCampaignSchema = new Schema({
  name:           { type: String, required: true },
  type:           { type: String, enum: ["email","event","social","ads","call","referral"] },
  description:    { type: String },
  startDate:      { type: Date },
  endDate:        { type: Date },
  budget:         { type: Number },
  actualCost:     { type: Number },
  targetAudience: { type: String },
  stats: {
    totalTargeted:         { type: Number, default: 0 },
    totalReached:          { type: Number, default: 0 },
    leadsGenerated:        { type: Number, default: 0 },
    opportunitiesCreated:  { type: Number, default: 0 },
    revenue:               { type: Number, default: 0 },
  },
  status:    { type: String, enum: ["planned","active","completed","cancelled"], default: "planned" },
  assignedTo:{ type: Schema.Types.ObjectId, ref: "User" },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("CrmCampaign", crmCampaignSchema);
