const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Lưu thông tin cơ bản của nhân viên/người dùng hệ thống.
 * Đây là collection trung tâm, liên kết với hầu hết các collection khác.
 */
const userSchema = new Schema({
  employeeCode: {
    type: String, unique: true, sparse: true,
    // Mã nhân viên duy nhất (VD: NV001). Được HR gán khi tạo tài khoản
  },
  fullName:  { type: String, required: true, trim: true },
  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:     { type: String, trim: true },
  avatar:    { type: String }, // URL ảnh đại diện (Cloudinary)

  dateOfBirth: { type: Date },
  gender:      { type: String, enum: ["male", "female", "other"] },
  address: {
    street:   { type: String },
    ward:     { type: String },
    district: { type: String },
    city:     { type: String },
    country:  { type: String, default: "Vietnam" },
  },
  identityCard: {
    number:      { type: String },
    issuedDate:  { type: Date },
    issuedPlace: { type: String },
  },
  bankAccount: {
    bankName:      { type: String }, // Tên ngân hàng
    accountNumber: { type: String }, // Số tài khoản
    accountName:   { type: String }, // Tên chủ tài khoản
  },
  taxCode:       { type: String }, // Mã số thuế cá nhân (dùng tính thuế TNCN)
  insuranceCode: { type: String }, // Mã số BHXH

  // ─── Liên kết tổ chức ───────────────────────────────────────────────────
  department: { type: Schema.Types.ObjectId, ref: "Department" },
  // → Phòng ban mà nhân viên thuộc về
  group:      { type: Schema.Types.ObjectId, ref: "Group" },
  // → Nhóm trong phòng ban
  position:   { type: Schema.Types.ObjectId, ref: "Position" },
  // → Chức vụ/vị trí công việc
  role:       { type: Schema.Types.ObjectId, ref: "Role" },
  // → Vai trò hệ thống (xác định quyền truy cập)
  managerId:  { type: Schema.Types.ObjectId, ref: "User" },
  // → Quản lý trực tiếp (self-reference)
  salaryGrade:{ type: Schema.Types.ObjectId, ref: "SalaryGrade" },
  // → Bậc lương (Junior/Senior/Lead...)
  workShift:  { type: Schema.Types.ObjectId, ref: "WorkShift" },
  // → Ca làm việc được gán

  joinDate:         { type: Date },   // Ngày vào làm
  probationEndDate: { type: Date },   // Ngày hết thử việc
  contractId:       { type: Schema.Types.ObjectId, ref: "Contract" },
  // → Hợp đồng lao động đang hiệu lực

  // ─── Trạng thái tài khoản ───────────────────────────────────────────────
  isEmailVerified: { type: Boolean, default: false },
  isActive:        { type: Boolean, default: true },
  // false = tài khoản bị khóa bởi HR
  status: {
    type: String,
    enum: ["probation", "official", "resigned", "terminated"],
    default: "probation",
    // probation: thử việc | official: chính thức | resigned: đã nghỉ | terminated: sa thải
  },

  // ─── Bảo mật ────────────────────────────────────────────────────────────
  failedLoginAttempts: { type: Number, default: 0 },
  // Số lần đăng nhập sai liên tiếp. Đạt 5 → khóa tài khoản
  lockUntil:           { type: Date },
  // Thời điểm tài khoản được mở khóa (sau brute-force)
  passwordChangedAt:   { type: Date },
  // Dùng để invalidate JWT cũ sau khi đổi mật khẩu
  lastLoginAt:         { type: Date },

  // ─── OAuth ──────────────────────────────────────────────────────────────
  googleId: { type: String, unique: true, sparse: true },
  // Google OAuth2 ID (khi đăng nhập bằng Google)

}, { timestamps: true });

// Indexes
userSchema.index({ department: 1 });
userSchema.index({ role: 1 });
userSchema.index({ status: 1 });
userSchema.index({ email: 1 });

module.exports = mongoose.model("User", userSchema);
