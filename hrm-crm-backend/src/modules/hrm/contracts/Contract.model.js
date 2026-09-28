const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Lưu hợp đồng lao động giữa công ty và nhân viên.
 * Quan hệ: nhiều Contract thuộc 1 User | tham chiếu Department, Position
 */
const contractSchema = new Schema({
  userId:         { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  contractNumber: { type: String, required: true, unique: true },
  // Số hợp đồng: "HD-2026-001". Auto generate hoặc HR nhập.

  type: {
    type: String, required: true,
    enum: ["probation","fixed_term_1y","fixed_term_2y","fixed_term_3y","indefinite"],
    // probation: thử việc | fixed_term: có thời hạn | indefinite: không xác định thời hạn
  },
  startDate:        { type: Date, required: true },
  endDate:          { type: Date },
  // null nếu loại indefinite
  probationEndDate: { type: Date },

  position:   { type: Schema.Types.ObjectId, ref: "Position" },
  department: { type: Schema.Types.ObjectId, ref: "Department" },

  salary: {
    base:       { type: Number, required: true },
    allowances: [{
      type:   { type: Schema.Types.ObjectId, ref: "AllowanceType" },
      amount: { type: Number },
    }],
  },
  workingHoursPerDay:  { type: Number, default: 8 },
  workDaysPerWeek:     { type: Number, default: 5 },
  clauses:             { type: String },
  // Điều khoản đặc biệt
  fileUrl:             { type: String },
  // URL file PDF hợp đồng scan/ký số

  status: {
    type: String,
    enum: ["draft","pending_sign","active","expired","terminated"],
    default: "draft",
  },
  signedByEmployee: { type: Boolean, default: false },
  signedByEmployer: { type: Boolean, default: false },
  signedAt:         { type: Date },
  terminatedAt:     { type: Date },
  terminationReason:{ type: String },

  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

contractSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Contract", contractSchema);
