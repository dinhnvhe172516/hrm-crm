const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Lưu trữ và phân quyền xem tài liệu nội bộ (quy trình, chính sách...).
 */
const documentSchema = new Schema({
  title:       { type: String, required: true },
  description: { type: String },
  category:    { type: Schema.Types.ObjectId, ref: "DocumentCategory" },
  fileId:      { type: Schema.Types.ObjectId, ref: "FileUpload" },
  version:     { type: String, default: "v1.0" },
  accessType:  { type: String, enum: ["all","department","group","specific"], default: "all" },
  accessDepartments: [{ type: Schema.Types.ObjectId, ref: "Department" }],
  accessGroups:      [{ type: Schema.Types.ObjectId, ref: "Group" }],
  accessUsers:       [{ type: Schema.Types.ObjectId, ref: "User" }],
  isPublished: { type: Boolean, default: false },
  publishedAt: { type: Date },
  tags:        [{ type: String }],
  uploadedBy:  { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("Document", documentSchema);
