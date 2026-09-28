const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Cơ hội bán hàng (Deal). Trung tâm của quy trình Sales.
 * Theo dõi deal từ lúc tạo đến Won/Lost. Tự động cập nhật expectedRevenue.
 * Quan hệ: gắn với Company + Contact + Pipeline + Stage | được giao cho User
 */
const crmOpportunitySchema = new Schema({
  name:       { type: String, required: true },
  company:    { type: Schema.Types.ObjectId, ref: "CrmCompany", index: true },
  contact:    { type: Schema.Types.ObjectId, ref: "CrmContact" },
  lead:       { type: Schema.Types.ObjectId, ref: "CrmLead" },
  pipeline:   { type: Schema.Types.ObjectId, ref: "CrmPipeline", required: true },
  stage:      { type: Schema.Types.ObjectId, ref: "CrmPipelineStage", required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", index: true },
  team:       [{ type: Schema.Types.ObjectId, ref: "User" }],
  value:          { type: Number, default: 0 },
  currency:       { type: String, default: "VND" },
  probability:    { type: Number, min: 0, max: 100 },
  expectedRevenue:{ type: Number },
  expectedCloseDate:{ type: Date },
  actualCloseDate:  { type: Date },
  products: [{
    product:    { type: Schema.Types.ObjectId, ref: "CrmProduct" },
    quantity:   { type: Number, default: 1 },
    unitPrice:  { type: Number },
    discount:   { type: Number, default: 0 },
    totalPrice: { type: Number },
  }],
  status:     { type: String, enum: ["open","won","lost","cancelled"], default: "open" },
  lostReason: { type: String },
  priority:   { type: String, enum: ["low","medium","high"], default: "medium" },
  tags:       [{ type: String }],
  stageHistory: [{
    stage:      { type: Schema.Types.ObjectId, ref: "CrmPipelineStage" },
    enteredAt:  { type: Date },
    exitedAt:   { type: Date },
    daysInStage:{ type: Number },
  }],
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
crmOpportunitySchema.index({ status: 1, expectedCloseDate: 1 });
module.exports = mongoose.model("CrmOpportunity", crmOpportunitySchema);
