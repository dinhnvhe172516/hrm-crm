const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Lưu token/OTP dùng một lần để đặt lại mật khẩu.
 * Token hết hạn sau 15 phút. Sau khi dùng → đánh dấu isUsed=true.
 * Quan hệ: nhiều PasswordResetToken thuộc 1 User (nhưng chỉ 1 cái active tại 1 thời điểm)
 */
const passwordResetTokenSchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  token:     { type: String, required: true },
  // SHA-256 hash của token ngẫu nhiên gửi qua email
  otp:       { type: String },
  // 6 chữ số nếu dùng OTP thay vì link
  type:      { type: String, enum: ["link","otp"], default: "link" },

  isUsed:    { type: Boolean, default: false },
  usedAt:    { type: Date },
  ipAddress: { type: String }, // IP của request gửi yêu cầu reset
  expiresAt: { type: Date, required: true },
  // Hết hạn sau 15 phút từ lúc tạo
}, { timestamps: true });

passwordResetTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("PasswordResetToken", passwordResetTokenSchema);
