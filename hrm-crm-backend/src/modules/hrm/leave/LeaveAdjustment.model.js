const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Ghi lại lịch sử HR điều chỉnh số ngày phép thủ công.
 * Dùng cho: thưởng phép | phạt phép | điều chỉnh đầu năm
 * Quan hệ: thuộc 1 User | tham chiếu LeaveType | được tạo bởi HR (User)
 */
const leaveAdjustmentSchema = new Schema({
  userId:         { type: Schema.Types.ObjectId, ref: "User", required: true },
  leaveType:      { type: Schema.Types.ObjectId, ref: "LeaveType", required: true },
  year:           { type: Number, required: true },
  adjustmentDays: { type: Number, required: true },
  // Số ngày điều chỉnh: dương (+) là cộng thêm, âm (-) là trừ
  reason:         { type: String, required: true },
  // "Thưởng phép Q3 xuất sắc" | "Đầu năm cấp phép"
  adjustedBy:     { type: Schema.Types.ObjectId, ref: "User", required: true },
  // → HR thực hiện điều chỉnh
}, { timestamps: true });

module.exports = mongoose.model("LeaveAdjustment", leaveAdjustmentSchema);
