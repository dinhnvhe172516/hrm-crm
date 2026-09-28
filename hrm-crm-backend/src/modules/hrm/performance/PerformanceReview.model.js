const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Lưu kết quả đánh giá hiệu suất. Chu trình: tự đánh giá → manager → HR.
 * Kết quả liên kết với Bonus để tính thưởng KPI.
 */
const performanceReviewSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  reviewerId: { type: Schema.Types.ObjectId, ref: "User" },
  templateId: { type: Schema.Types.ObjectId, ref: "ReviewTemplate" },
  period: {
    type:      { type: String, enum: ["quarterly","yearly"] },
    quarter:   { type: Number },
    year:      { type: Number, required: true },
    startDate: { type: Date },
    endDate:   { type: Date },
  },
  kpiScores: [{
    criteriaTitle: { type: String },
    target:        { type: String },
    result:        { type: String },
    weight:        { type: Number },
    score:         { type: Number },
    comment:       { type: String },
  }],
  competencyScores: [{
    name:    { type: String },
    weight:  { type: Number },
    score:   { type: Number },
    comment: { type: String },
  }],
  selfEvaluation:  { type: String },
  reviewerComment: { type: String },
  hrComment:       { type: String },
  finalScore:      { type: Number },
  rating:          { type: String, enum: ["outstanding","excellent","good","needs_improvement","poor"] },
  isBonusLinked:   { type: Boolean, default: false },
  bonusAmount:     { type: Number },
  status:          { type: String, enum: ["pending_self","pending_review","pending_hr","done","acknowledged"], default: "pending_self" },
  acknowledgedAt:  { type: Date },
}, { timestamps: true });
module.exports = mongoose.model("PerformanceReview", performanceReviewSchema);
