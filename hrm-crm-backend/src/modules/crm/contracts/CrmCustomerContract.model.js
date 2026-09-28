const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Hợp đồng với khách hàng (khác hợp đồng lao động HRM).
 * Theo dõi tiến độ thanh toán theo đợt.
 */
const crmCustomerContractSchema = new Schema({
  contractNumber: { type: String, required: true, unique: true },
  company:    { type: Schema.Types.ObjectId, ref: "CrmCompany", required: true, index: true },
  contact:    { type: Schema.Types.ObjectId, ref: "CrmContact" },
  opportunity:{ type: Schema.Types.ObjectId, ref: "CrmOpportunity" },
  quotation:  { type: Schema.Types.ObjectId, ref: "CrmQuotation" },
  type:       { type: String, enum: ["sale","service","maintenance","partnership","subscription"] },
  items: [{
    product:    { type: Schema.Types.ObjectId, ref: "CrmProduct" },
    description:{ type: String },
    quantity:   { type: Number },
    unitPrice:  { type: Number },
    totalPrice: { type: Number },
  }],
  totalValue: { type: Number },
  currency:   { type: String, default: "VND" },
  startDate:  { type: Date },
  endDate:    { type: Date },
  autoRenew:  { type: Boolean, default: false },
  paymentSchedule: [{
    dueDate:     { type: Date },
    amount:      { type: Number },
    description: { type: String },  // "Đợt 1 - 50% khi ký HĐ"
    isPaid:      { type: Boolean, default: false },
    paidAt:      { type: Date },
    invoiceId:   { type: Schema.Types.ObjectId, ref: "CrmInvoice" },
  }],
  fileUrl:           { type: String },
  status:            { type: String, enum: ["draft","active","completed","terminated","expired"], default: "draft" },
  signedByCustomer:  { type: Boolean, default: false },
  signedByCompany:   { type: Boolean, default: false },
  signedAt:          { type: Date },
  terminatedAt:      { type: Date },
  terminationReason: { type: String },
  assignedTo:        { type: Schema.Types.ObjectId, ref: "User" },
  createdBy:         { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("CrmCustomerContract", crmCustomerContractSchema);
