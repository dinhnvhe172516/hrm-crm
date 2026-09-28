const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Quản lý file upload tập trung. Dùng cho mọi attachment trong hệ thống.
 */
const fileUploadSchema = new Schema({
  originalName: { type: String },
  storageName:  { type: String },
  url:          { type: String, required: true },
  mimeType:     { type: String },
  size:         { type: Number },
  storage:      { type: String, enum: ["cloudinary","s3","local"], default: "cloudinary" },
  bucket:       { type: String },
  uploadedBy:   { type: Schema.Types.ObjectId, ref: "User" },
  refModel:     { type: String },
  refId:        { type: Schema.Types.ObjectId },
  isTemp:       { type: Boolean, default: true },
  // true = chưa gắn vào entity nào. Cleanup job sẽ xóa isTemp=true sau 24h
}, { timestamps: true });
module.exports = mongoose.model("FileUpload", fileUploadSchema);
