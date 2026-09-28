const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Cấu hình pipeline bán hàng (có thể có nhiều pipeline cho từng loại KH).
 */
const crmPipelineSchema = new Schema({
  name:        { type: String, required: true },
  description: { type: String },
  isDefault:   { type: Boolean, default: false },
  isActive:    { type: Boolean, default: true },
  createdBy:   { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("CrmPipeline", crmPipelineSchema);
