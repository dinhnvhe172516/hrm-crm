const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Phân loại chi phí công tác (đi lại, ăn uống, lưu trú...).
 */
const expenseCategorySchema = new Schema({
  name:                { type: String, required: true },
  code:                { type: String, unique: true },
  maxAmountPerRequest: { type: Number },
  requiresReceipt:     { type: Boolean, default: true },
  isActive:            { type: Boolean, default: true },
}, { timestamps: true });
module.exports = mongoose.model("ExpenseCategory", expenseCategorySchema);
