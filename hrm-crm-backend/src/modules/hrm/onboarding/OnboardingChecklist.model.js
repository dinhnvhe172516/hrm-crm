const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Checklist onboarding thực tế cho từng nhân viên mới.
 * Tạo tự động từ OnboardingTemplate khi có nhân viên mới.
 */
const onboardingChecklistSchema = new Schema({
  userId:     { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  templateId: { type: Schema.Types.ObjectId, ref: "OnboardingTemplate" },
  startDate:  { type: Date },
  tasks: [{
    title:           { type: String },
    description:     { type: String },
    responsibleRole: { type: String },
    assignedTo:      { type: Schema.Types.ObjectId, ref: "User" },
    dueDate:         { type: Date },
    category:        { type: String },
    isRequired:      { type: Boolean },
    status:          { type: String, enum: ["pending","in_progress","done","skipped"], default: "pending" },
    completedAt:     { type: Date },
    completedBy:     { type: Schema.Types.ObjectId, ref: "User" },
    note:            { type: String },
  }],
  overallProgress: { type: Number, default: 0 },
  status:          { type: String, enum: ["in_progress","completed"], default: "in_progress" },
  completedAt:     { type: Date },
}, { timestamps: true });
module.exports = mongoose.model("OnboardingChecklist", onboardingChecklistSchema);
