const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Ghi lại lịch sử mọi thay đổi nhân sự quan trọng của user.
 * Dùng cho: audit trail | xem lịch sử thăng chức | tính thâm niên chính xác
 * Quan hệ: nhiều EmployeeHistory thuộc 1 User | được tạo bởi 1 User (HR/Manager)
 */
const employeeHistorySchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  // → Nhân viên bị thay đổi

  changeType: {
    type: String, required: true,
    enum: ["department","position","salary","role","status","manager","shift","contract"],
    // Loại thay đổi để filter nhanh
  },
  from: { type: Schema.Types.Mixed },
  // Snapshot giá trị CŨ. VD: { department: "Marketing", salary: 10000000 }
  to:   { type: Schema.Types.Mixed },
  // Snapshot giá trị MỚI.

  reason:        { type: String },
  // Lý do thay đổi (bắt buộc ghi khi thay đổi salary, status)
  effectiveDate: { type: Date, required: true },
  // Ngày thay đổi có hiệu lực (có thể khác ngày tạo record)
  approvedBy:    { type: Schema.Types.ObjectId, ref: "User" },
  // → HR/Manager phê duyệt thay đổi
  note:          { type: String },
}, { timestamps: true });

module.exports = mongoose.model("EmployeeHistory", employeeHistorySchema);
