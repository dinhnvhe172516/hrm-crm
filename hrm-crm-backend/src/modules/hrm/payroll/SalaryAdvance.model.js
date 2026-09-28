const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Quản lý tạm ứng lương. Tự động trừ vào lương tháng theo lịch.
 */
const salaryAdvanceSchema = new Schema({
  userId:      { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  amount:      { type: Number, required: true },
  reason:      { type: String },
  requestedDate: { type: Date },

  repaymentSchedule: [{
    month:  { type: Number },
    year:   { type: Number },
    amount: { type: Number },
    isPaid: { type: Boolean, default: false },
    // Khi tính Payroll tháng này → trừ amount → đánh dấu isPaid=true
  }],

  status:       { type: String, enum: ["pending","approved","rejected","fully_repaid"], default: "pending" },
  approvedBy:   { type: Schema.Types.ObjectId, ref: "User" },
  approvedAt:   { type: Date },
  rejectReason: { type: String },
}, { timestamps: true });

module.exports = mongoose.model("SalaryAdvance", salaryAdvanceSchema);
