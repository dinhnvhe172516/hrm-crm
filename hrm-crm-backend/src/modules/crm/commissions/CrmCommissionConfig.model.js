const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Cấu hình tỷ lệ hoa hồng cho Sales theo điều kiện.
 */
const crmCommissionConfigSchema = new Schema({
  name:      { type: String, required: true },
  rules: [{
    condition: { minValue: Number, maxValue: Number, product: { type: Schema.Types.ObjectId, ref: "CrmProduct" } },
    rate:      { type: Number },   // % hoa hồng
    type:      { type: String, enum: ["percentage","fixed"] },
  }],
  applicableTo: [{ type: Schema.Types.ObjectId, ref: "User" }],
  effectiveFrom:{ type: Date },
  effectiveTo:  { type: Date },
  isActive:     { type: Boolean, default: true },
  createdBy:    { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("CrmCommissionConfig", crmCommissionConfigSchema);
