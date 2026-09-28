const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Quản lý nhóm nhỏ trong phòng ban.
 * VD: Phòng Marketing → Nhóm Content, Nhóm Design, Nhóm SEO
 * Quan hệ: 1 Group thuộc 1 Department | 1 Group có nhiều User (members[])
 */
const groupSchema = new Schema({
  name:       { type: String, required: true, trim: true },
  department: { type: Schema.Types.ObjectId, ref: "Department", required: true },
  // → Phòng ban mà nhóm này thuộc về

  leaderId: { type: Schema.Types.ObjectId, ref: "User" },
  // → Trưởng nhóm
  members:  [{ type: Schema.Types.ObjectId, ref: "User" }],
  // → Danh sách thành viên nhóm

  description: { type: String },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

groupSchema.index({ department: 1 });

module.exports = mongoose.model("Group", groupSchema);
