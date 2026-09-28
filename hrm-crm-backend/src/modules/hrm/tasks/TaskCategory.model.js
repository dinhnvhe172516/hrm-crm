const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Phân loại task theo màu sắc và icon.
 */
const taskCategorySchema = new Schema({
  name: { type: String, required: true },
  color: { type: String, default: "#3b82f6" },
  icon: { type: String },
  description: { type: String },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model("TaskCategory", taskCategorySchema);
