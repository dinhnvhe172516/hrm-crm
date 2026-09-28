const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Quản lý thưởng (KPI, thưởng tết, thưởng dự án...).
 * Tách riêng để quản lý linh hoạt, sau đó cộng vào Payroll.
 */
const bonusSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type:   {
    type: String,
    enum: ["kpi","tet","project","referral","attendance","performance","other"],
  },
  amount:      { type: Number, required: true },
  reason:      { type: String },
  appliedMonth:{ type: Number },
  appliedYear: { type: Number },
  status:      { type: String, enum: ["pending","approved","paid","cancelled"], default: "pending" },
  approvedBy:  { type: Schema.Types.ObjectId, ref: "User" },
  paidAt:      { type: Date },
  createdBy:   { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Bonus", bonusSchema);
