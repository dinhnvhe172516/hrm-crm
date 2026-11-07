'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Bảng lương hàng tháng của từng nhân viên (Payroll / Payslip).
 * Hỗ trợ: Tính công chuẩn, phụ cấp, thưởng, OT, trừ BHXH/BHYT/BHTN, thuế TNCN lũy tiến, thực lĩnh.
 * Quan hệ: 1 Payroll thuộc 1 User
 */
const payrollSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  month:  { type: Number, required: true },
  year:   { type: Number, required: true },

  standardWorkDays: { type: Number, default: 22 },  // Số ngày công chuẩn của tháng
  actualWorkDays:   { type: Number, default: 0 },   // Số ngày công thực tế (từ Attendance)
  paidLeaveDays:    { type: Number, default: 0 },   // Nghỉ phép có lương (từ Leave)
  unpaidLeaveDays:  { type: Number, default: 0 },   // Nghỉ không lương

  salaryBase:       { type: Number, default: 0 },   // Lương cơ bản theo hợp đồng
  allowances:       { type: Number, default: 0 },   // Tổng phụ cấp (xăng xe, ăn trưa, điện thoại...)
  bonus:            { type: Number, default: 0 },   // Thưởng chuyên cần, KPI
  overtimePay:      { type: Number, default: 0 },   // Tiền làm thêm giờ

  grossIncome:      { type: Number, default: 0 },   // Tổng thu nhập trước thuế

  deductions: {
    bhxh:     { type: Number, default: 0 },         // BHXH (8%)
    bhyt:     { type: Number, default: 0 },         // BHYT (1.5%)
    bhtn:     { type: Number, default: 0 },         // BHTN (1%)
    tax:      { type: Number, default: 0 },         // Thuế TNCN
    advance:  { type: Number, default: 0 },         // Tạm ứng lương
    total:    { type: Number, default: 0 },         // Tổng các khoản trích trừ
  },

  netSalary:        { type: Number, default: 0 },   // Thực lĩnh = Gross - Deductions

  status: {
    type: String,
    enum: ['draft', 'pending_approval', 'approved', 'paid'],
    default: 'draft',
  },

  paymentMethod: {
    type: String,
    enum: ['bank_transfer', 'cash'],
    default: 'bank_transfer',
  },
  paidAt:      { type: Date },
  approvedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  approvedAt:  { type: Date },
  note:        { type: String },
}, { timestamps: true });

payrollSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
payrollSchema.index({ month: 1, year: 1, status: 1 });

module.exports = mongoose.model('Payroll', payrollSchema);
