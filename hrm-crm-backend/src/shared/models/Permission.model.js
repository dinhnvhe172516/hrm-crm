const mongoose = require("mongoose");
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Định nghĩa quyền chi tiết theo module + hành động.
 * Format code: "module:action" (VD: "employee:read", "payroll:approve")
 * Quan hệ: nhiều Permission thuộc nhiều Role (M-M qua Role.permissions[])
 */
const permissionSchema = new Schema({
  name:   { type: String, required: true },
  // Tên hiển thị: "Xem danh sách nhân viên"
  code:   { type: String, required: true, unique: true },
  // Mã duy nhất: "employee:read"
  module: {
    type: String, required: true,
    enum: [
      "employee","department","group","attendance","leave","payroll",
      "task","meeting","notification","announcement","document",
      "performance","training","recruitment","report","system",
      "crm_company","crm_contact","crm_lead","crm_opportunity",
      "crm_activity","crm_product","crm_quotation","crm_contract",
      "crm_invoice","crm_campaign","crm_commission","crm_ticket"
    ],
    // Module mà quyền này kiểm soát
  },
  action: {
    type: String, required: true,
    enum: ["read","create","update","delete","approve","reject","export","import"],
    // Hành động được phép thực hiện
  },
  description: { type: String },
  isSystem:    { type: Boolean, default: false },
  // true = quyền hệ thống, không thể xóa
});

module.exports = mongoose.model("Permission", permissionSchema);
