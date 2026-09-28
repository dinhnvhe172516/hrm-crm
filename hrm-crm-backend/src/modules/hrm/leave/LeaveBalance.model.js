const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Theo dõi số ngày phép còn lại của mỗi nhân viên theo từng loại phép.
 * Tách riêng khỏi LeaveRequest để query số dư nhanh (không cần aggregate LeaveRequest).
 * Quan hệ: 1 LeaveBalance thuộc 1 User | tham chiếu nhiều LeaveType
 */
const leaveBalanceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  year:   { type: Number, required: true },

  balances: [{
    leaveType:  { type: Schema.Types.ObjectId, ref: "LeaveType" },
    entitled:   { type: Number, default: 0 },
    // Số ngày được hưởng trong năm (từ config LeaveType)
    carryOver:  { type: Number, default: 0 },
    // Ngày phép chuyển từ năm trước
    adjustment: { type: Number, default: 0 },
    // HR điều chỉnh thủ công (+ thưởng phép | - phạt phép)
    used:       { type: Number, default: 0 },
    // Đã dùng (update khi LeaveRequest status=approved)
    pending:    { type: Number, default: 0 },
    // Đang chờ duyệt (update khi tạo LeaveRequest mới)
    remaining:  { type: Number, default: 0 },
    // = entitled + carryOver + adjustment - used - pending (computed)
  }],
}, { timestamps: true });

leaveBalanceSchema.index({ userId: 1, year: 1 }, { unique: true });

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
