const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Mẫu đánh giá KPI tái sử dụng cho nhiều nhân viên/kỳ đánh giá.
 */
const reviewTemplateSchema = new Schema({
  name:           { type: String, required: true },
  applicableTo:   { type: String, enum: ["all","department","position"] },
  targetDepartments: [{ type: Schema.Types.ObjectId, ref: "Department" }],
  targetPositions:   [{ type: Schema.Types.ObjectId, ref: "Position" }],
  kpiCriteria: [{
    title:       { type: String },
    description: { type: String },
    weight:      { type: Number },  // Tổng weight của tất cả KPI = 100
    maxScore:    { type: Number, default: 10 },
  }],
  competencyCriteria: [{
    name:        { type: String },
    description: { type: String },
    weight:      { type: Number },
    maxScore:    { type: Number, default: 10 },
  }],
  isActive:  { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("ReviewTemplate", reviewTemplateSchema);
