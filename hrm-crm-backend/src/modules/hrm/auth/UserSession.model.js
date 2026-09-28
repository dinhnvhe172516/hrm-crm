const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Quản lý phiên đăng nhập của từng thiết bị.
 * Hỗ trợ Multi-device login: 1 user có thể đăng nhập nhiều thiết bị cùng lúc.
 * Cho phép xem & thu hồi phiên từ xa.
 * Quan hệ: nhiều Session thuộc 1 User | 1 Session có nhiều RefreshToken
 */
const userSessionSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId, ref: "User", required: true, index: true,
    // → User đang đăng nhập
  },
  sessionToken: { type: String, required: true, unique: true },
  // UUID duy nhất đại diện cho phiên này. Dùng để map với refresh token.

  deviceInfo: {
    deviceId:   { type: String },   // Fingerprint thiết bị (từ client)
    deviceName: { type: String },   // "Chrome on Windows 11"
    deviceType: { type: String, enum: ["desktop","mobile","tablet","unknown"] },
    browser:    { type: String },   // "Chrome 120"
    os:         { type: String },   // "Windows 11"
    ipAddress:  { type: String },   // IP đăng nhập
    location:   { type: String },   // "Ho Chi Minh City, VN" (GeoIP lookup)
  },

  isActive:       { type: Boolean, default: true },
  // false = đã logout hoặc bị thu hồi
  lastActivityAt: { type: Date, default: Date.now },
  // Cập nhật mỗi request → detect session không hoạt động
  expiresAt: { type: Date, required: true },
  // Thời điểm session hết hạn. TTL index sẽ tự xóa document sau thời điểm này.
  loggedOutAt: { type: Date },
  // Thời điểm logout (nếu user chủ động logout)
}, { timestamps: true });

userSessionSchema.index({ userId: 1, isActive: 1 });
userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

module.exports = mongoose.model("UserSession", userSessionSchema);
