const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Lưu riêng thông tin xác thực (mật khẩu).
 * Tách khỏi User để: không bao giờ expose password khi query user thông thường.
 * Quan hệ: 1-1 với User (mỗi user có đúng 1 credential)
 */
const userCredentialSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId, ref: "User",
    required: true, unique: true,
    // → Liên kết 1-1 với User
  },
  passwordHash: { type: String, required: true },
  // bcrypt hash (cost factor 12). KHÔNG BAO GIỜ lưu plain text
  passwordSalt: { type: String },
  // Salt riêng (optional nếu bcrypt đã tích hợp salt)

  passwordHistory: [{
    hash:      { type: String },      // Hash của mật khẩu cũ
    changedAt: { type: Date },        // Thời điểm đổi
  }],
  // Lưu 5 MK gần nhất → không cho đặt lại MK đã dùng

  mustChangePassword:       { type: Boolean, default: false },
  // true = HR reset MK → buộc đổi lần đăng nhập tiếp theo
  mustChangePasswordReason: {
    type: String,
    enum: ["first_login", "admin_reset", "policy", "security"],
  },
}, { timestamps: true });

module.exports = mongoose.model("UserCredential", userCredentialSchema);
