const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Hoa hồng thực tế cho từng deal won. Tích hợp với Payroll HRM.
 */
const crmCommissionSchema = new Schema({
  userId:       { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  opportunity:  { type: Schema.Types.ObjectId, ref: "CrmOpportunity" },
  invoice:      { type: Schema.Types.ObjectId, ref: "CrmInvoice" },
  config:       { type: Schema.Types.ObjectId, ref: "CrmCommissionConfig" },
  dealValue:        { type: Number },
  commissionRate:   { type: Number },
  commissionAmount: { type: Number },
  month:  { type: Number },
  year:   { type: Number },
  status: { type: String, enum: ["pending","approved","paid"], default: "pending" },
  paidAt: { type: Date },
  linkedPayroll: { type: Schema.Types.ObjectId, ref: "Payroll" },
  // → Khi trả hoa hồng → cộng vào Payroll tháng này
}, { timestamps: true });
module.exports = mongoose.model("CrmCommission", crmCommissionSchema);
