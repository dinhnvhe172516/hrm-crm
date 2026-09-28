const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Quản lý Refresh Token với chiến lược Rotation.
 * Mỗi lần dùng refresh token → tạo token mới + vô hiệu hóa token cũ.
 * Nếu token cũ đã bị thu hồi mà còn được dùng lại → phát hiện tấn công
 *   → thu hồi toàn bộ family → buộc login lại.
 * Quan hệ: nhiều RefreshToken thuộc 1 UserSession thuộc 1 User
 */
const refreshTokenSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  sessionId: { type: Schema.Types.ObjectId, ref: "UserSession", required: true },
  // → Phiên đăng nhập mà token này thuộc về

  token: { type: String, required: true, unique: true },
  // SHA-256 hash của refresh token thực (không lưu plain text)
  family: { type: String, required: true, index: true },
  // UUID nhóm token liên quan (cùng chain rotation). Dùng để detect reuse attack.

  isRevoked:     { type: Boolean, default: false },
  revokedAt:     { type: Date },
  revokedReason: {
    type: String,
    enum: ["used","logout","logout_all","security_breach","expired"],
    // used: đã dùng để lấy token mới | logout: user logout |
    // security_breach: phát hiện tái sử dụng token đã thu hồi
  },
  replacedByToken: { type: String },
  // Hash của token mới thay thế token này (chain tracing)

  expiresAt: { type: Date, required: true },
  // Thời điểm token hết hạn (thường 7-30 ngày)
}, { timestamps: true });

refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL

module.exports = mongoose.model("RefreshToken", refreshTokenSchema);
