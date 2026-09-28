const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Xác thực email khi đăng ký hoặc thay đổi email.
 * Quan hệ: 1 EmailVerification thuộc 1 User
 */
const emailVerificationSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: "User", required: true },
  email:      { type: String, required: true },
  // Email cần verify (có thể khác email hiện tại nếu đang thay đổi email)
  token:      { type: String, required: true },
  // SHA-256 hash của token
  otp:        { type: String },
  // 6 chữ số (alternative)
  isVerified: { type: Boolean, default: false },
  verifiedAt: { type: Date },
  expiresAt:  { type: Date, required: true },
  // Hết hạn sau 24 giờ
}, { timestamps: true });

emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("EmailVerification", emailVerificationSchema);
