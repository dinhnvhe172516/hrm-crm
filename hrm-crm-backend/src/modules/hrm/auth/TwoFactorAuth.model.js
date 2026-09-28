const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Quản lý xác thực 2 lớp (2FA) cho từng user.
 * Hỗ trợ: TOTP (Google Authenticator) + Backup codes
 * Quan hệ: 1-1 với User
 */
const twoFactorAuthSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  isEnabled: { type: Boolean, default: false },

  totp: {
    secret:     { type: String },
    // Mã bí mật TOTP (encrypted AES trước khi lưu). Dùng để gen & verify OTP 30 giây
    isVerified: { type: Boolean, default: false },
    // true = user đã setup thành công (quét QR + nhập OTP đúng)
    enabledAt:  { type: Date },
  },

  backupCodes: [{
    code:   { type: String },
    // SHA-256 hash của backup code 8 ký tự
    isUsed: { type: Boolean, default: false },
    usedAt: { type: Date },
  }],
  // 10 backup codes. Dùng khi mất điện thoại. Mỗi code dùng được đúng 1 lần.

  otpChannel: {
    type: String, enum: ["totp","email","sms"], default: "totp",
  },
}, { timestamps: true });

module.exports = mongoose.model("TwoFactorAuth", twoFactorAuthSchema);
