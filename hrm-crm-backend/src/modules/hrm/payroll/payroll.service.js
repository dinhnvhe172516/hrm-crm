'use strict';

const dayjs        = require('dayjs');
const Payroll      = require('./Payroll.model');
const Attendance   = require('../attendance/Attendance.model');
const LeaveRequest = require('../leave/LeaveRequest.model');
const User         = require('../../../shared/models/User.model');
const Position     = require('../../../shared/models/Position.model');
const Department   = require('../../../shared/models/Department.model');
const { AppError } = require('../../../middlewares/error.middleware');
const logger       = require('../../../shared/utils/logger');

/**
 * Tính thuế TNCN lũy tiến theo quy định hiện hành tại Việt Nam
 */
const calculatePersonalIncomeTax = (taxableIncome) => {
  if (taxableIncome <= 0) return 0;

  let tax = 0;
  if (taxableIncome <= 5000000) {
    tax = taxableIncome * 0.05;
  } else if (taxableIncome <= 10000000) {
    tax = 5000000 * 0.05 + (taxableIncome - 5000000) * 0.10;
  } else if (taxableIncome <= 18000000) {
    tax = 5000000 * 0.05 + 5000000 * 0.10 + (taxableIncome - 10000000) * 0.15;
  } else if (taxableIncome <= 32000000) {
    tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + (taxableIncome - 18000000) * 0.20;
  } else if (taxableIncome <= 52000000) {
    tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + 14000000 * 0.20 + (taxableIncome - 32000000) * 0.25;
  } else if (taxableIncome <= 80000000) {
    tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + 14000000 * 0.20 + 20000000 * 0.25 + (taxableIncome - 52000000) * 0.30;
  } else {
    tax = 5000000 * 0.05 + 5000000 * 0.10 + 8000000 * 0.15 + 14000000 * 0.20 + 20000000 * 0.25 + 28000000 * 0.30 + (taxableIncome - 80000000) * 0.35;
  }

  return Math.round(tax);
};

const payrollService = {
  /**
   * 1. Tính toán chi tiết bảng lương cho 1 nhân viên trong tháng
   */
  calculateForEmployee: async ({ userId, month, year, standardWorkDays = 22 }) => {
    const user = await User.findById(userId).populate('position').populate('department');
    if (!user) throw new AppError('Nhân viên không tồn tại', 404);

    const m = Number(month);
    const y = Number(year);

    // Xác định mức lương cơ sở theo Position Level nếu chưa gán hợp đồng
    const posLevel = user.position?.level || 1;
    const baseSalariesByLevel = {
      1: 10000000, // Junior: 10tr
      2: 16000000, // Mid: 16tr
      3: 24000000, // Senior: 24tr
      4: 35000000, // Lead / Manager: 35tr
      5: 50000000, // Director / BOD: 50tr
    };
    const salaryBase = baseSalariesByLevel[posLevel] || 12000000;

    // 1. Quét công thực tế từ Attendance trong tháng
    const startDate = new Date(Date.UTC(y, m - 1, 1));
    const endDate   = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999));

    const attendanceRecords = await Attendance.find({
      userId,
      date: { $gte: startDate, $lte: endDate },
    }).lean();

    let actualWorkDays  = 0;
    let paidLeaveDays   = 0;
    let unpaidLeaveDays = 0;
    let overtimeHours   = 0;

    attendanceRecords.forEach((att) => {
      if (att.status === 'on_leave') {
        if ((att.workUnits || 0) > 0) {
          paidLeaveDays += att.workUnits;
        } else {
          unpaidLeaveDays += 1;
        }
      } else {
        actualWorkDays += att.workUnits || 0;
      }
      overtimeHours += att.overtimeHours || 0;
    });

    // 2. Tính lương theo ngày công
    const totalPaidDays = Math.min(standardWorkDays, actualWorkDays + paidLeaveDays);
    const proratedSalary = Math.round((salaryBase / standardWorkDays) * totalPaidDays);

    // 3. Phụ cấp (Cơm trưa 35.000đ/ngày làm việc + 600.000đ xăng xe)
    const lunchAllowance = Math.round(actualWorkDays * 35000);
    const otherAllowances = 600000;
    const allowances = lunchAllowance + otherAllowances;

    // 4. Tiền làm thêm giờ (OT: 150% lương giờ)
    const hourlyRate = salaryBase / standardWorkDays / 8;
    const overtimePay = Math.round(hourlyRate * overtimeHours * 1.5);

    // 5. Thưởng chuyên cần (nếu làm đủ công và không đi muộn quá 1 lần)
    const bonus = actualWorkDays >= standardWorkDays ? 500000 : 0;

    // 6. Tổng thu nhập (Gross)
    const grossIncome = proratedSalary + allowances + overtimePay + bonus;

    // 7. Các khoản trích nộp bảo hiểm (trần 36tr)
    const bhCap = Math.min(salaryBase, 36000000);
    const bhxh = Math.round(bhCap * 0.08);   // 8%
    const bhyt = Math.round(bhCap * 0.015);  // 1.5%
    const bhtn = Math.round(bhCap * 0.01);   // 1%
    const insuranceTotal = bhxh + bhyt + bhtn;

    // 8. Thuế TNCN
    const personalDeduction = 11000000; // Giảm trừ bản thân
    const taxableIncome = Math.max(0, grossIncome - insuranceTotal - personalDeduction);
    const tax = calculatePersonalIncomeTax(taxableIncome);

    const deductionTotal = insuranceTotal + tax;
    const netSalary = Math.max(0, grossIncome - deductionTotal);

    // 9. Lưu bản ghi Payroll
    const payroll = await Payroll.findOneAndUpdate(
      { userId, month: m, year: y },
      {
        userId,
        month: m,
        year: y,
        standardWorkDays,
        actualWorkDays: Math.round(actualWorkDays * 10) / 10,
        paidLeaveDays: Math.round(paidLeaveDays * 10) / 10,
        unpaidLeaveDays,
        salaryBase,
        allowances,
        bonus,
        overtimePay,
        grossIncome,
        deductions: {
          bhxh,
          bhyt,
          bhtn,
          tax,
          advance: 0,
          total: deductionTotal,
        },
        netSalary,
        status: 'draft',
      },
      { upsert: true, new: true }
    );

    return payroll;
  },

  /**
   * 2. Tự động tính toán bảng lương cả tháng cho toàn bộ nhân sự
   */
  generateMonthlyPayroll: async ({ month, year, department, standardWorkDays = 22 }, adminUser) => {
    const m = Number(month) || dayjs().month() + 1;
    const y = Number(year)  || dayjs().year();

    const userQuery = { isActive: true };
    if (department) userQuery.department = department;

    const employees = await User.find(userQuery).select('_id fullName email employeeCode');

    logger.info(`Generating payroll for ${employees.length} employees for ${m}/${y}...`);

    const results = [];
    for (const emp of employees) {
      try {
        const item = await payrollService.calculateForEmployee({
          userId: emp._id,
          month: m,
          year: y,
          standardWorkDays,
        });
        results.push(item);
      } catch (err) {
        logger.warn(`Failed to calculate payroll for ${emp.email}: ${err.message}`);
      }
    }

    const totalNet = results.reduce((acc, r) => acc + (r.netSalary || 0), 0);
    const totalGross = results.reduce((acc, r) => acc + (r.grossIncome || 0), 0);

    return {
      month: m,
      year: y,
      totalEmployees: results.length,
      totalGross,
      totalNet,
      payrolls: results,
    };
  },

  /**
   * 3. Lấy danh sách bảng lương (kèm phân trang, lọc)
   */
  getAll: async ({ skip = 0, limit = 50, query = {} }) => {
    const filter = {};

    if (query.month) filter.month = Number(query.month);
    if (query.year)  filter.year  = Number(query.year);
    if (query.status) filter.status = query.status;

    if (query.department) {
      const deptUsers = await User.find({ department: query.department }).select('_id');
      filter.userId = { $in: deptUsers.map((u) => u._id) };
    }

    const [data, total] = await Promise.all([
      Payroll.find(filter)
        .populate('userId', 'fullName email employeeCode avatar department position bankAccount')
        .populate({
          path: 'userId',
          populate: [
            { path: 'department', select: 'name code' },
            { path: 'position',   select: 'title code' },
          ],
        })
        .sort({ year: -1, month: -1, 'userId.employeeCode': 1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      Payroll.countDocuments(filter),
    ]);

    // Thống kê quỹ lương của kết quả lọc
    const totalGross = data.reduce((acc, r) => acc + (r.grossIncome || 0), 0);
    const totalNet   = data.reduce((acc, r) => acc + (r.netSalary || 0), 0);

    return { data, total, totalGross, totalNet };
  },

  /**
   * 4. Xem phiếu lương cá nhân (My Payslip)
   */
  getMyPayslip: async (userId, { month, year }) => {
    const m = Number(month) || dayjs().month() + 1;
    const y = Number(year)  || dayjs().year();

    let record = await Payroll.findOne({ userId, month: m, year: y })
      .populate('userId', 'fullName email employeeCode department position bankAccount')
      .populate({
        path: 'userId',
        populate: [
          { path: 'department', select: 'name code' },
          { path: 'position',   select: 'title code' },
        ],
      })
      .lean();

    // Nếu chưa có bảng lương tính trước, tính nhanh tạm thời
    if (!record) {
      const calculated = await payrollService.calculateForEmployee({ userId, month: m, year: y });
      record = await Payroll.findById(calculated._id)
        .populate('userId', 'fullName email employeeCode department position bankAccount')
        .populate({
          path: 'userId',
          populate: [
            { path: 'department', select: 'name code' },
            { path: 'position',   select: 'title code' },
          ],
        })
        .lean();
    }

    return record;
  },

  /**
   * 5. Phê duyệt bảng lương (BOD / HR Manager)
   */
  approvePayroll: async (id, adminUser) => {
    const payroll = await Payroll.findById(id);
    if (!payroll) throw new AppError('Không tìm thấy bảng lương', 404);

    payroll.status     = 'approved';
    payroll.approvedBy = adminUser.userId;
    payroll.approvedAt = new Date();
    await payroll.save();

    logger.info(`Payroll ${id} approved by ${adminUser.email || adminUser.userId}`);
    return payroll;
  },

  /**
   * 6. Đánh dấu đã chi trả lương
   */
  markAsPaid: async (id, { paymentMethod = 'bank_transfer' }, adminUser) => {
    const payroll = await Payroll.findById(id);
    if (!payroll) throw new AppError('Không tìm thấy bảng lương', 404);

    payroll.status        = 'paid';
    payroll.paymentMethod = paymentMethod;
    payroll.paidAt        = new Date();
    await payroll.save();

    logger.info(`Payroll ${id} marked as paid via ${paymentMethod} by ${adminUser.email}`);
    return payroll;
  },
};

module.exports = payrollService;
