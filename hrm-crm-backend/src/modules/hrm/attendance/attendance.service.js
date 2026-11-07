'use strict';

const dayjs         = require('dayjs');
const Attendance    = require('./Attendance.model');
const WorkShift     = require('./WorkShift.model');
const Holiday       = require('./Holiday.model');
const User          = require('../../../shared/models/User.model');
const Department    = require('../../../shared/models/Department.model');
const { AppError }  = require('../../../middlewares/error.middleware');
const { parseDeviceInfo } = require('../../../shared/helpers/device');
const logger        = require('../../../shared/utils/logger');

/**
 * Chuẩn hóa ngày về 00:00:00 UTC
 */
const normalizeDate = (d = new Date()) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Chuyển chuỗi "HH:mm" thành số phút từ đầu ngày
 */
const timeStringToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + (minutes || 0);
};

/**
 * Lấy ca làm việc áp dụng cho user (ưu tiên ca gán riêng, fallback ca mặc định)
 */
const getUserWorkShift = async (user) => {
  if (user?.workShift) {
    const shift = await WorkShift.findById(user.workShift);
    if (shift && shift.isActive) return shift;
  }
  // Tìm ca mặc định
  let defaultShift = await WorkShift.findOne({ isDefault: true, isActive: true });
  if (!defaultShift) {
    // Tự động tạo ca chuẩn nếu chưa có
    defaultShift = await WorkShift.create({
      name:           'Ca hành chính tiêu chuẩn',
      code:           'OFFICE_STANDARD',
      startTime:      '08:30',
      endTime:        '17:30',
      breakStartTime: '12:00',
      breakEndTime:   '13:00',
      breakMinutes:   60,
      workDays:       ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      isDefault:      true,
      isActive:       true,
    });
  }
  return defaultShift;
};

const attendanceService = {
  /**
   * 1. CHECK-IN
   */
  checkIn: async (userId, payload, req) => {
    const today = normalizeDate();
    const user = await User.findById(userId).populate('workShift');
    if (!user || !user.isActive) throw new AppError('Tài khoản không hợp lệ hoặc đã bị khóa', 403);

    // Kiểm tra xem hôm nay đã check-in chưa
    let record = await Attendance.findOne({ userId, date: today });
    if (record && record.checkIn?.time) {
      const checkInFormatted = dayjs(record.checkIn.time).format('HH:mm:ss');
      throw new AppError(`Bạn đã thực hiện check-in hôm nay vào lúc ${checkInFormatted}`, 400);
    }

    const shift = await getUserWorkShift(user);
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const shiftStartMinutes = timeStringToMinutes(shift.startTime);

    // Tính số phút đi muộn (cho phép trễ 5 phút ân hạn)
    const lateMinutes = Math.max(0, currentMinutes - shiftStartMinutes);
    const isLate = lateMinutes > 5;
    const status = isLate ? 'late' : 'present';

    const device = parseDeviceInfo(req);

    const checkInData = {
      time: now,
      ip: req.ip || device.ipAddress,
      device: device.deviceName || req.headers['user-agent'],
      location: payload?.location || null,
      photo: payload?.photo || null,
    };

    if (record) {
      record.checkIn = checkInData;
      record.workShift = shift._id;
      record.status = status;
      record.lateMinutes = isLate ? lateMinutes : 0;
      record.standardHours = 8;
      if (payload?.note) record.note = payload.note;
      await record.save();
    } else {
      record = await Attendance.create({
        userId,
        date: today,
        workShift: shift._id,
        checkIn: checkInData,
        status,
        standardHours: 8,
        lateMinutes: isLate ? lateMinutes : 0,
        note: payload?.note || null,
      });
    }

    logger.info(`Check-in recorded: User ${user.employeeCode || user.email} at ${dayjs(now).format('HH:mm')}, Status: ${status}`);

    return {
      message: isLate
        ? `Check-in thành công. Bạn đến muộn ${lateMinutes} phút so với giờ bắt đầu (${shift.startTime}).`
        : `Check-in đúng giờ thành công! Chúc bạn một ngày làm việc hiệu quả.`,
      attendance: record,
      isLate,
      lateMinutes,
    };
  },

  /**
   * 2. CHECK-OUT
   */
  checkOut: async (userId, payload, req) => {
    const today = normalizeDate();
    const record = await Attendance.findOne({ userId, date: today }).populate('workShift');
    if (!record || !record.checkIn?.time) {
      throw new AppError('Bạn chưa thực hiện Check-in hôm nay. Vui lòng Check-in trước khi Check-out.', 400);
    }

    const shift = record.workShift || (await getUserWorkShift(await User.findById(userId)));
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const shiftEndMinutes = timeStringToMinutes(shift.endTime);

    // Tính số phút về sớm
    const earlyMinutes = Math.max(0, shiftEndMinutes - currentMinutes);
    const isEarly = earlyMinutes > 5;

    // Cập nhật trạng thái tổng hợp của ngày
    let finalStatus = record.status;
    if (record.status === 'late') {
      finalStatus = isEarly ? 'late_and_early' : 'late';
    } else {
      finalStatus = isEarly ? 'early_leave' : 'present';
    }

    // Tính thời gian làm việc thực tế (giờ)
    const checkInTime = new Date(record.checkIn.time);
    const totalMs = now.getTime() - checkInTime.getTime();
    let rawHours = totalMs / (1000 * 60 * 60);

    // Trừ giờ nghỉ trưa nếu làm việc qua giờ nghỉ
    if (rawHours > 5 && shift.breakMinutes) {
      rawHours = Math.max(0, rawHours - shift.breakMinutes / 60);
    }

    const workingHours = Math.round(rawHours * 10) / 10;

    // Tính công chuẩn: >= 7h: 1 công, >= 3.5h: 0.5 công, < 3.5h: 0 công
    let workUnits = 0;
    if (workingHours >= 7) {
      workUnits = 1.0;
    } else if (workingHours >= 3.5) {
      workUnits = 0.5;
    } else {
      workUnits = 0;
    }

    const device = parseDeviceInfo(req);

    record.checkOut = {
      time: now,
      ip: req.ip || device.ipAddress,
      device: device.deviceName || req.headers['user-agent'],
      location: payload?.location || null,
      photo: payload?.photo || null,
    };
    record.status = finalStatus;
    record.earlyMinutes = isEarly ? earlyMinutes : 0;
    record.workingHours = workingHours;
    record.workUnits = workUnits;
    if (payload?.note) {
      record.note = record.note ? `${record.note} | ${payload.note}` : payload.note;
    }

    await record.save();
    logger.info(`Check-out recorded: User ${userId} at ${dayjs(now).format('HH:mm')}, Working hours: ${workingHours}h, Work units: ${workUnits}`);

    return {
      message: isEarly
        ? `Check-out thành công. Bạn về sớm ${earlyMinutes} phút so với giờ kết thúc (${shift.endTime}).`
        : `Check-out thành công! Bạn đã hoàn thành ${workingHours} giờ làm việc (${workUnits} công).`,
      attendance: record,
      workingHours,
      workUnits,
      isEarly,
      earlyMinutes,
    };
  },

  /**
   * 3. Lấy trạng thái chấm công hôm nay của nhân viên hiện tại
   */
  getTodayStatus: async (userId) => {
    const today = normalizeDate();
    const [record, user] = await Promise.all([
      Attendance.findOne({ userId, date: today }).populate('workShift').lean(),
      User.findById(userId).populate('workShift').lean(),
    ]);

    const shift = record?.workShift || (await getUserWorkShift(user));

    return {
      date: today,
      shift: {
        id:        shift._id,
        name:      shift.name,
        code:      shift.code,
        startTime: shift.startTime,
        endTime:   shift.endTime,
      },
      hasCheckedIn:  Boolean(record?.checkIn?.time),
      hasCheckedOut: Boolean(record?.checkOut?.time),
      attendance:    record || null,
    };
  },

  /**
   * 4. Lấy bảng chấm công cá nhân theo tháng (My Timesheet)
   */
  getMyTimesheet: async (userId, { month, year }) => {
    const currentYear  = Number(year)  || dayjs().year();
    const currentMonth = Number(month) || dayjs().month() + 1; // 1-12

    const startDate = new Date(Date.UTC(currentYear, currentMonth - 1, 1));
    const endDate   = new Date(Date.UTC(currentYear, currentMonth, 0, 23, 59, 59, 999));

    const records = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    })
      .populate('workShift', 'name startTime endTime')
      .sort({ date: 1 })
      .lean();

    // Thống kê tháng
    let totalWorkUnits    = 0;
    let totalWorkingHours = 0;
    let lateCount         = 0;
    let earlyCount        = 0;
    let onLeaveCount      = 0;

    records.forEach((r) => {
      totalWorkUnits    += r.workUnits || 0;
      totalWorkingHours += r.workingHours || 0;
      if (r.status === 'late' || r.status === 'late_and_early') lateCount++;
      if (r.status === 'early_leave' || r.status === 'late_and_early') earlyCount++;
      if (r.status === 'on_leave') onLeaveCount++;
    });

    return {
      month: currentMonth,
      year:  currentYear,
      summary: {
        totalDaysLogged:   records.length,
        totalWorkUnits:    Math.round(totalWorkUnits * 10) / 10,
        totalWorkingHours: Math.round(totalWorkingHours * 10) / 10,
        lateCount,
        earlyCount,
        onLeaveCount,
      },
      records,
    };
  },

  /**
   * 5. Lấy danh sách chấm công toàn công ty (cho HR & Manager)
   */
  getAll: async ({ skip = 0, limit = 50, query = {} }) => {
    const filter = {};

    if (query.date) {
      filter.date = normalizeDate(query.date);
    } else if (query.startDate || query.endDate) {
      filter.date = {};
      if (query.startDate) filter.date.$gte = normalizeDate(query.startDate);
      if (query.endDate)   filter.date.$lte = new Date(new Date(query.endDate).setHours(23, 59, 59, 999));
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.userId) {
      filter.userId = query.userId;
    }

    // Nếu lọc theo phòng ban: tìm danh sách user thuộc phòng ban đó
    if (query.department) {
      const deptUsers = await User.find({ department: query.department }).select('_id');
      const userIds = deptUsers.map((u) => u._id);
      filter.userId = { $in: userIds };
    }

    const [data, total] = await Promise.all([
      Attendance.find(filter)
        .populate('userId', 'fullName email employeeCode avatar department position')
        .populate({
          path: 'userId',
          populate: [
            { path: 'department', select: 'name code' },
            { path: 'position',   select: 'title code' },
          ],
        })
        .populate('workShift', 'name startTime endTime')
        .sort({ date: -1, createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      Attendance.countDocuments(filter),
    ]);

    return { data, total };
  },

  /**
   * 6. Điều chỉnh chấm công thủ công (bởi HR / Quản trị viên)
   */
  adjustAttendance: async (id, payload, adminUser) => {
    const record = await Attendance.findById(id);
    if (!record) throw new AppError('Không tìm thấy bản ghi chấm công', 404);

    const { checkInTime, checkOutTime, status, workUnits, workingHours, note, reason } = payload;

    if (checkInTime !== undefined) {
      record.checkIn = {
        ...record.checkIn,
        time: checkInTime ? new Date(checkInTime) : null,
      };
    }

    if (checkOutTime !== undefined) {
      record.checkOut = {
        ...record.checkOut,
        time: checkOutTime ? new Date(checkOutTime) : null,
      };
    }

    if (status !== undefined)       record.status       = status;
    if (workUnits !== undefined)    record.workUnits    = Number(workUnits);
    if (workingHours !== undefined) record.workingHours = Number(workingHours);
    if (note !== undefined)         record.note         = note;

    record.isManualAdjustment = true;
    record.adjustedBy         = adminUser.userId || adminUser._id;
    record.adjustedReason     = reason || 'HR điều chỉnh thủ công';

    await record.save();
    logger.info(`Attendance ${id} manually adjusted by ${adminUser.email || adminUser.userId}`);

    return record;
  },

  /**
   * 7. Quản lý Ca làm việc (WorkShift CRUD)
   */
  getShifts: async () => {
    return WorkShift.find().sort({ isDefault: -1, createdAt: 1 }).lean();
  },

  createShift: async (data, user) => {
    const { name, code, startTime, endTime, breakMinutes, workDays, isDefault } = data;
    if (!name || !startTime || !endTime) {
      throw new AppError('Tên ca, giờ bắt đầu và kết thúc là bắt buộc', 400);
    }

    if (isDefault) {
      await WorkShift.updateMany({}, { isDefault: false });
    }

    const shift = await WorkShift.create({
      name:         name.trim(),
      code:         code ? code.trim().toUpperCase() : undefined,
      startTime:    startTime.trim(),
      endTime:      endTime.trim(),
      breakMinutes: Number(breakMinutes) || 60,
      workDays:     workDays || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      isDefault:    Boolean(isDefault),
      isActive:     true,
    });

    logger.info(`WorkShift created: ${shift.name} by ${user?.email || user?.userId}`);
    return shift;
  },

  updateShift: async (id, data, user) => {
    const shift = await WorkShift.findById(id);
    if (!shift) throw new AppError('Ca làm việc không tồn tại', 404);

    if (data.isDefault) {
      await WorkShift.updateMany({ _id: { $ne: id } }, { isDefault: false });
    }

    Object.assign(shift, data);
    await shift.save();
    logger.info(`WorkShift updated: ${shift.name} by ${user?.email || user?.userId}`);
    return shift;
  },

  deleteShift: async (id, user) => {
    const shift = await WorkShift.findById(id);
    if (!shift) throw new AppError('Ca làm việc không tồn tại', 404);

    const countUsers = await User.countDocuments({ workShift: id });
    if (countUsers > 0) {
      throw new AppError(`Không thể xóa ca đang có ${countUsers} nhân viên được gán. Hãy chuyển ca cho nhân viên trước.`, 400);
    }

    shift.isActive = false;
    await shift.save();
    logger.info(`WorkShift deactivated: ${shift.name} by ${user?.email || user?.userId}`);
    return { message: 'Đã hủy kích hoạt ca làm việc thành công' };
  },
};

module.exports = attendanceService;
