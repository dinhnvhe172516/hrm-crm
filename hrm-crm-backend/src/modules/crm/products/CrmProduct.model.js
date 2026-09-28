const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Danh mục sản phẩm/dịch vụ của công ty. Dùng trong Quotation và Opportunity.
 */
const crmProductSchema = new Schema({
  name:     { type: String, required: true },
  code:     { type: String, unique: true, sparse: true },
  category: { type: String },
  description:{ type: String },
  unit:     { type: String },
  basePrice:{ type: Number, required: true },
  currency: { type: String, default: "VND" },
  taxRate:  { type: Number, default: 10 },
  isActive: { type: Boolean, default: true },
  images:   [{ type: String }],
  createdBy:{ type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("CrmProduct", crmProductSchema);
