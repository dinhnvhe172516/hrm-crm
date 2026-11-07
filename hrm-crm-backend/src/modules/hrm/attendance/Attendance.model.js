'use strict';

const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * CÔNG DỤNG: Lưu nhật ký chấm công hàng ngày của từng nhân viên.
 * Hỗ trợ: Check-in, Check-out, GPS / IP / Device, tính toán đi muộn / về sớm, số giờ làm thực tế, công chuẩn.
 * Quan hệ: 1 Attendance thuộc 1 User | tham chiếu 1 WorkShift
 */
const attendanceSchema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  date:   { type: Date, required: true, index: true }, // Ngày chấm công chuẩn hóa (00:00:00 UTC)

  workShift: { type: Schema.Types.ObjectId, ref: 'WorkShift' },

  checkIn: {
    time:     { type: Date },
    ip:       { type: String },
    device:   { type: String },
    location: {
      latitude:  { type: Number },
      longitude: { type: Number },
      address:   { type: String },
    },
    photo:    { type: String },
  },

  checkOut: {
    time:     { type: Date },
    ip:       { type: String },
    device:   { type: String },
    location: {
      latitude:  { type: Number },
      longitude: { type: Number },
      address:   { type: String },
    },
    photo:    { type: String },
  },

  status: {
    type: String,
    enum: ['present', 'late', 'early_leave', 'late_and_early', 'absent', 'half_day', 'on_leave', 'holiday', 'wfh'],
    default: 'present',
  },

  standardHours: { type: Number, default: 8 },  // Số giờ tiêu chuẩn của ca làm việc
  workingHours:  { type: Number, default: 0 },  // Số giờ làm việc thực tế
  lateMinutes:   { type: Number, default: 0 },  // Số phút đi muộn
  earlyMinutes:  { type: Number, default: 0 },  // Số phút về sớm
  overtimeHours: { type: Number, default: 0 },  // Số giờ OT
  workUnits:     { type: Number, default: 0 },  // Công làm việc: 1 (đủ ngày), 0.5 (nửa ngày), 0 (nghỉ)

  note:               { type: String },
  isManualAdjustment: { type: Boolean, default: false },
  adjustedBy:         { type: Schema.Types.ObjectId, ref: 'User' },
  adjustedReason:     { type: String },
}, { timestamps: true });

attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1, status: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
