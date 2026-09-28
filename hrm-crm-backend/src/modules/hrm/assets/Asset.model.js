const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Quản lý tài sản công ty giao cho nhân viên.
 * Theo dõi vòng đời: còn sẵn → đang dùng → bảo trì → nghỉ hưu
 * Quan hệ: 1 Asset được giao cho 1 User | thuộc về công ty
 */
const assetSchema = new Schema({
  name:         { type: String, required: true },
  code:         { type: String, required: true, unique: true },
  // Mã tài sản: "ASSET-001". Dùng để quét QR theo dõi.
  category:     { type: String, enum: ["laptop","phone","monitor","vehicle","furniture","other"] },
  brand:        { type: String },
  model:        { type: String },
  serialNumber: { type: String },
  specifications: { type: Schema.Types.Mixed },
  // { ram: "16GB", storage: "512GB SSD", cpu: "Intel i7" }

  purchaseDate:      { type: Date },
  purchasePrice:     { type: Number },
  depreciationYears: { type: Number },
  // Số năm khấu hao
  currentValue:      { type: Number },
  // Giá trị hiện tại sau khấu hao

  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },
  // → Nhân viên đang giữ tài sản. null = chưa giao
  assignedAt:      { type: Date },
  returnedAt:      { type: Date },
  returnCondition: { type: String },
  // Tình trạng khi trả: "good", "damaged", "lost"

  condition: { type: String, enum: ["new","good","fair","damaged","lost"], default: "new" },
  status:    { type: String, enum: ["available","in_use","maintenance","retired"], default: "available" },

  images: [{ type: String }],
  // URLs ảnh tài sản
  note:   { type: String },
}, { timestamps: true });

module.exports = mongoose.model("Asset", assetSchema);
