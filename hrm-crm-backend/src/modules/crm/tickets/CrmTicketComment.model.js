const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Comment nội bộ hoặc reply gửi KH trên Ticket.
 * isInternal=true: note nội bộ, KH không thấy.
 */
const crmTicketCommentSchema = new Schema({
  ticket:      { type: Schema.Types.ObjectId, ref: "CrmSupportTicket", required: true, index: true },
  author:      { type: Schema.Types.ObjectId, ref: "User", required: true },
  content:     { type: String, required: true },
  attachments: [{ type: Schema.Types.ObjectId, ref: "FileUpload" }],
  isInternal:  { type: Boolean, default: false },
  isEdited:    { type: Boolean, default: false },
  editedAt:    { type: Date },
}, { timestamps: true });
module.exports = mongoose.model("CrmTicketComment", crmTicketCommentSchema);
