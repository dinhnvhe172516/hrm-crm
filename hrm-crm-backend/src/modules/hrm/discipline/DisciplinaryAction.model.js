const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Ghi lại quyết định kỷ luật nhân viên.
 */
const disciplinaryActionSchema = new Schema({
  userId:          { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  type:            { type: String, enum: ["warning","written_warning","suspension","termination"] },
  reason:          { type: String, required: true },
  description:     { type: String },
  incidentDate:    { type: Date },
  effectiveDate:   { type: Date },
  suspensionDays:  { type: Number },
  salaryDeduction: { type: Number },
  acknowledgement: {
    isSigned:        { type: Boolean, default: false },
    signedAt:        { type: Date },
    employeeResponse:{ type: String },
  },
  attachments: [{ type: Schema.Types.ObjectId, ref: "FileUpload" }],
  issuedBy:    { type: Schema.Types.ObjectId, ref: "User" },
  approvedBy:  { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("DisciplinaryAction", disciplinaryActionSchema);
