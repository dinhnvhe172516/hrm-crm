const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Mẫu checklist onboarding tái sử dụng cho nhiều nhân viên mới.
 */
const onboardingTemplateSchema = new Schema({
  name: { type: String, required: true },
  applicableDepartments: [{ type: Schema.Types.ObjectId, ref: "Department" }],
  applicablePositions:   [{ type: Schema.Types.ObjectId, ref: "Position" }],
  tasks: [{
    title:           { type: String },
    description:     { type: String },
    responsibleRole: { type: String, enum: ["hr","it","manager","employee"] },
    dueAfterDays:    { type: Number },
    // Cần hoàn thành trong X ngày kể từ ngày onboarding bắt đầu
    category:        { type: String, enum: ["equipment","document","training","introduction","system_access"] },
    isRequired:      { type: Boolean, default: true },
  }],
  isActive:  { type: Boolean, default: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("OnboardingTemplate", onboardingTemplateSchema);
