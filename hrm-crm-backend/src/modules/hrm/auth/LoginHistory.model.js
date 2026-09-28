const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Ghi lại mọi lần đăng nhập (thành công và thất bại).
 * Dùng cho: Security audit | Phát hiện đăng nhập bất thường | Điều tra sự cố
 * Quan hệ: nhiều LoginHistory thuộc 1 User (userId có thể null nếu email không tồn tại)
 */
const loginHistorySchema = new Schema({
  userId:    { type: Schema.Types.ObjectId, ref: "User", index: true },
  // null nếu đăng nhập với email không tồn tại trong hệ thống
  email:     { type: String },
  // Email được nhập vào (kể cả khi sai)

  isSuccess: { type: Boolean, required: true },
  failureReason: {
    type: String,
    enum: ["wrong_password","account_locked","not_found","2fa_failed","account_inactive"],
    // Lý do thất bại (null nếu thành công)
  },

  ipAddress:  { type: String },
  userAgent:  { type: String },
  deviceInfo: {
    browser:    { type: String },
    os:         { type: String },
    deviceType: { type: String },
  },
  location:  { type: String }, // GeoIP: "Ho Chi Minh City, VN"
  sessionId: { type: Schema.Types.ObjectId, ref: "UserSession" },
  // → Session được tạo ra (nếu đăng nhập thành công)
}, { timestamps: true });

loginHistorySchema.index({ userId: 1, createdAt: -1 });
loginHistorySchema.index({ createdAt: -1 });

module.exports = mongoose.model("LoginHistory", loginHistorySchema);
