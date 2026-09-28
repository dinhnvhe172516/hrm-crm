const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Báo giá gửi cho khách hàng. Hỗ trợ phiên bản (v1,v2...).
 * Khi KH chấp nhận → chuyển sang CrmCustomerContract.
 */
const crmQuotationSchema = new Schema({
  quotationNumber: { type: String, required: true, unique: true },
  version:         { type: Number, default: 1 },
  parentQuotation: { type: Schema.Types.ObjectId, ref: "CrmQuotation" },
  opportunity: { type: Schema.Types.ObjectId, ref: "CrmOpportunity" },
  company:     { type: Schema.Types.ObjectId, ref: "CrmCompany", required: true },
  contact:     { type: Schema.Types.ObjectId, ref: "CrmContact" },
  items: [{
    product:        { type: Schema.Types.ObjectId, ref: "CrmProduct" },
    description:    { type: String },
    quantity:       { type: Number, default: 1 },
    unit:           { type: String },
    unitPrice:      { type: Number },
    discount:       { type: Number, default: 0 },
    discountAmount: { type: Number },
    taxRate:        { type: Number, default: 10 },
    taxAmount:      { type: Number },
    totalPrice:     { type: Number },
  }],
  subtotal:      { type: Number },
  totalDiscount: { type: Number },
  totalTax:      { type: Number },
  grandTotal:    { type: Number },
  currency:      { type: String, default: "VND" },
  paymentTerms:  { type: String },
  deliveryTime:  { type: String },
  validUntil:    { type: Date },
  notes:         { type: String },
  status: { type: String, enum: ["draft","sent","accepted","rejected","expired"], default: "draft" },
  sentAt:       { type: Date },
  respondedAt:  { type: Date },
  assignedTo:   { type: Schema.Types.ObjectId, ref: "User" },
  createdBy:    { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("CrmQuotation", crmQuotationSchema);
