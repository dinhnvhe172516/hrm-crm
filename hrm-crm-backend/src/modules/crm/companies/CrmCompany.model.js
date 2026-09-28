const mongoose = require("mongoose");
const { Schema } = mongoose;
/**
 * CÔNG DỤNG: Lưu thông tin công ty khách hàng/đối tác/nhà cung cấp.
 * Trung tâm của CRM: Contact, Lead, Opportunity, Contract đều gắn vào Company.
 */
const crmCompanySchema = new Schema({
  name:    { type: String, required: true, trim: true },
  code:    { type: String, unique: true, sparse: true },  // "CUS-001"
  taxCode: { type: String },
  type:    { type: String, enum: ["customer","partner","supplier","prospect"], default: "prospect" },
  industry:{ type: String },  // "technology","retail","manufacturing","finance"...
  size:    { type: String, enum: ["1-10","11-50","51-200","201-500","500+"] },
  website: { type: String },
  email:   { type: String },
  phone:   { type: String },
  address: { street:String, district:String, city:String, country:{ type:String, default:"Vietnam" } },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User" },  // Sales phụ trách
  status:     { type: String, enum: ["active","inactive"], default: "active" },
  rating:     { type: String, enum: ["hot","warm","cold"] },
  tags:       [{ type: String }],
  description:{ type: String },
  stats: {
    totalDeals:  { type: Number, default: 0 },
    wonDeals:    { type: Number, default: 0 },
    totalRevenue:{ type: Number, default: 0 },
    openTickets: { type: Number, default: 0 },
  },
  createdBy: { type: Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });
crmCompanySchema.index({ assignedTo: 1, type: 1 });
module.exports = mongoose.model("CrmCompany", crmCompanySchema);
