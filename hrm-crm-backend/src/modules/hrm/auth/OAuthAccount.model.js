const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Lưu thông tin OAuth từ provider (Google, Microsoft...).
 * Quan trọng: lưu Google accessToken để gọi Calendar API (tạo Google Meet).
 * Quan hệ: nhiều OAuthAccount thuộc 1 User (mỗi provider 1 record)
 */
const oAuthAccountSchema = new Schema({
  userId:   { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  provider: { type: String, enum: ["google","microsoft"], required: true },
  // Tên provider
  providerId: { type: String, required: true },
  // ID từ provider (Google sub, Microsoft oid). unique per provider

  email:  { type: String },
  name:   { type: String },
  avatar: { type: String },

  accessToken:  { type: String },
  // Encrypted. Dùng để gọi Google Calendar API (tạo Meet link)
  refreshToken: { type: String },
  // Encrypted. Dùng để làm mới accessToken khi hết hạn
  tokenExpiresAt: { type: Date },

  scope: [{ type: String }],
  // ["https://www.googleapis.com/auth/calendar", "email", "profile"]
  // Danh sách quyền được cấp từ Google
}, { timestamps: true });

oAuthAccountSchema.index({ userId: 1, provider: 1 }, { unique: true });

module.exports = mongoose.model("OAuthAccount", oAuthAccountSchema);
