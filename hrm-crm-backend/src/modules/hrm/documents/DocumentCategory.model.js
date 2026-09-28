const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Phân loại tài liệu nội bộ theo danh mục phân cấp.
 */
const documentCategorySchema = new Schema({
  name:     { type: String, required: true },
  parentId: { type: Schema.Types.ObjectId, ref: "DocumentCategory" },
  icon:     { type: String },
  order:    { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model("DocumentCategory", documentCategorySchema);
