const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Đơn xin nghỉ phép của nhân viên. Workflow 2 bước: Manager → HR.
 * Quan hệ: thuộc 1 User | tham chiếu LeaveType | được duyệt bởi nhiều User (approvalFlow)
 */
const leaveRequestSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  leaveType: { type: Schema.Types.ObjectId, ref: "LeaveType", required: true },

  startDate:  { type: Date, required: true },
  endDate:    { type: Date, required: true },
  totalDays:  { type: Number, required: true },
  // Tổng ngày nghỉ thực tế (không tính cuối tuần, ngày lễ)
  isHalfDay:       { type: Boolean, default: false },
  halfDaySession:  { type: String, enum: ["morning","afternoon"] },
  // Xin nghỉ nửa ngày: sáng hay chiều

  reason:      { type: String, required: true },
  attachments: [{ type: String }],
  // URLs giấy tờ kèm theo (giấy bác sĩ, giấy mời...)

  status: {
    type: String,
    enum: ["pending","approved","rejected","cancelled"],
    default: "pending",
  },

  approvalFlow: [{
    step:        { type: Number },      // 1: Manager, 2: HR
    approverId:  { type: Schema.Types.ObjectId, ref: "User" },
    approverRole:{ type: String, enum: ["manager","hr"] },
    status:      { type: String, enum: ["waiting","approved","rejected"] },
    comment:     { type: String },
    respondedAt: { type: Date },
  }],
  // Multi-step approval: khi step 1 approve → tự động chuyển step 2

  approvedDays:  { type: Number },
  // Số ngày được duyệt (có thể khác request nếu HR điều chỉnh)
  cancelledAt:   { type: Date },
  cancelReason:  { type: String },
}, { timestamps: true });

leaveRequestSchema.index({ userId: 1, status: 1 });
leaveRequestSchema.index({ startDate: 1, endDate: 1 });

module.exports = mongoose.model("LeaveRequest", leaveRequestSchema);
