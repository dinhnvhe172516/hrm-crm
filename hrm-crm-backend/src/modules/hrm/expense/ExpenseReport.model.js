const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Đề nghị thanh toán chi phí công tác. Workflow duyệt Manager → Kế toán.
 */
const expenseReportSchema = new Schema({
  userId:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title:   { type: String },
  purpose: { type: String },
  items: [{
    categoryId:  { type: Schema.Types.ObjectId, ref: "ExpenseCategory" },
    description: { type: String },
    amount:      { type: Number },
    date:        { type: Date },
    receiptUrl:  { type: String },
  }],
  totalAmount:   { type: Number },
  currency:      { type: String, default: "VND" },
  status:        { type: String, enum: ["draft","submitted","approved","rejected","paid"], default: "draft" },
  approvalFlow: [{
    step:        { type: Number },
    approverId:  { type: Schema.Types.ObjectId, ref: "User" },
    status:      { type: String, enum: ["waiting","approved","rejected"] },
    comment:     { type: String },
    respondedAt: { type: Date },
  }],
  paidAt:        { type: Date },
  paymentMethod: { type: String },
}, { timestamps: true });
module.exports = mongoose.model("ExpenseReport", expenseReportSchema);
