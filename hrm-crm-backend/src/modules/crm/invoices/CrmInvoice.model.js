const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Hoá đơn xuất cho khách hàng. Theo dõi thanh toán nhiều đợt, cảnh báo quá hạn.
 */
const crmInvoiceSchema = new Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  company:  { type: Schema.Types.ObjectId, ref: "CrmCompany", required: true, index: true },
  contact:  { type: Schema.Types.ObjectId, ref: "CrmContact" },
  contract: { type: Schema.Types.ObjectId, ref: "CrmCustomerContract" },
  quotation:{ type: Schema.Types.ObjectId, ref: "CrmQuotation" },
  items: [{
    product:     { type: Schema.Types.ObjectId, ref: "CrmProduct" },
    description: { type: String },
    quantity:    { type: Number },
    unitPrice:   { type: Number },
    discount:    { type: Number, default: 0 },
    taxRate:     { type: Number, default: 10 },
    taxAmount:   { type: Number },
    totalPrice:  { type: Number },
  }],
  subtotal:   { type: Number },
  totalTax:   { type: Number },
  grandTotal: { type: Number },
  currency:   { type: String, default: "VND" },
  issueDate:  { type: Date, default: Date.now },
  dueDate:    { type: Date },
  payments: [{
    amount:        { type: Number },
    method:        { type: String, enum: ["bank_transfer","cash","card","momo"] },
    paidAt:        { type: Date },
    transactionId: { type: String },
    note:          { type: String },
  }],
  amountPaid: { type: Number, default: 0 },
  amountDue:  { type: Number },
  status: { type: String, enum: ["draft","sent","partial","paid","overdue","cancelled"], default: "draft" },
  notes:      { type: String },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  createdBy:  { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("CrmInvoice", crmInvoiceSchema);
