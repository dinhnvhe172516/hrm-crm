const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Ticket hỗ trợ khách hàng. SLA cảnh báo quá hạn xử lý.
 */
const crmSupportTicketSchema = new Schema({
  ticketNumber: { type: String, required: true, unique: true },
  title:        { type: String, required: true },
  description:  { type: String },
  company:      { type: Schema.Types.ObjectId, ref: "CrmCompany", index: true },
  contact:      { type: Schema.Types.ObjectId, ref: "CrmContact" },
  contract:     { type: Schema.Types.ObjectId, ref: "CrmCustomerContract" },
  category:     { type: String, enum: ["bug","feature_request","question","complaint","other"] },
  priority:     { type: String, enum: ["low","medium","high","critical"], default: "medium" },
  assignedTo:   { type: Schema.Types.ObjectId, ref: "User" },
  assignedDepartment: { type: Schema.Types.ObjectId, ref: "Department" },
  slaDeadline:  { type: Date },
  isSlaBreached:{ type: Boolean, default: false },
  status: { type: String, enum: ["open","in_progress","pending_customer","resolved","closed"], default: "open" },
  resolution:   { type: String },
  resolvedAt:   { type: Date },
  closedAt:     { type: Date },
  customerRating:  { type: Number, min: 1, max: 5 },
  customerFeedback:{ type: String },
  attachments:  [{ type: Schema.Types.ObjectId, ref: "FileUpload" }],
  tags:         [{ type: String }],
  createdBy:    { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
module.exports = mongoose.model("CrmSupportTicket", crmSupportTicketSchema);
