'use strict';

const dayjs            = require('dayjs');
const LeaveType        = require('./LeaveType.model');
const LeaveBalance     = require('./LeaveBalance.model');
const LeaveRequest     = require('./LeaveRequest.model');
const LeaveAdjustment  = require('./LeaveAdjustment.model');
const Attendance       = require('../attendance/Attendance.model');
const User             = require('../../../shared/models/User.model');
const { AppError }     = require('../../../middlewares/error.middleware');
const logger           = require('../../../shared/utils/logger');

/**
 * Tự động khởi tạo các loại nghỉ phép tiêu chuẩn nếu DB chưa có
 */
const ensureDefaultLeaveTypes = async () => {
  const count = await LeaveType.countDocuments();
  if (count === 0) {
    await LeaveType.insertMany([
      {
        name:              'Nghỉ phép năm',
        code:              'annual',
        maxDaysPerYear:    12,
        maxDaysPerRequest: 5,
        minNoticeDays:     2,
        isPaid:            true,
        canCarryOver:      true,
        maxCarryOverDays:  5,
        requiresApproval:  true,
        description:       'Nghỉ phép hàng năm hưởng nguyên lương theo luật lao động',
      },
      {
        name:              'Nghỉ ốm / Khám bệnh',
        code:              'sick',
        maxDaysPerYear:    30,
        maxDaysPerRequest: 10,
        minNoticeDays:     0,
        isPaid:            true,
        requiresDocument:  true,
        requiresApproval:  true,
        description:       'Nghỉ ốm đau có xác nhận của cơ sở y tế',
      },
      {
        name:              'Nghỉ không lương',
        code:              'unpaid',
        maxDaysPerYear:    30,
        maxDaysPerRequest: 15,
        minNoticeDays:     3,
        isPaid:            false,
        requiresApproval:  true,
        description:       'Nghỉ việc riêng không hưởng lương',
      },
      {
        name:              'Nghỉ việc riêng có lương (Hiếu/Hỉ)',
        code:              'compassionate',
        maxDaysPerYear:    3,
        maxDaysPerRequest: 3,
        minNoticeDays:     1,
        isPaid:            true,
        requiresApproval:  true,
        description:       'Nghỉ kết hôn, ma chay theo quy định',
      },
      {
        name:              'Nghỉ thai sản',
        code:              'maternity',
        maxDaysPerYear:    180,
        maxDaysPerRequest: 180,
        minNoticeDays:     30,
        isPaid:            true,
        requiresDocument:  true,
        requiresApproval:  true,
        description:       'Nghỉ sinh con theo chế độ thai sản BHXH',
      },
    ]);
    logger.info('✅ Seeded 5 standard LeaveTypes successfully.');
  }
};

const leaveService = {
  /**
   * 1. Danh sách loại nghỉ phép
   */
  getLeaveTypes: async () => {
    await ensureDefaultLeaveTypes();
    return LeaveType.find({ isActive: true }).sort({ createdAt: 1 }).lean();
  },

  createLeaveType: async (data, user) => {
    const { name, code, maxDaysPerYear, isPaid, canCarryOver, requiresDocument } = data;
    if (!name || !code) throw new AppError('Tên và mã loại nghỉ phép là bắt buộc', 400);

    const normalizedCode = code.trim().toLowerCase();
    const existing = await LeaveType.findOne({ code: normalizedCode });
    if (existing) throw new AppError(`Mã loại nghỉ phép "${normalizedCode}" đã tồn tại`, 409);

    const newType = await LeaveType.create({
      ...data,
      code: normalizedCode,
      name: name.trim(),
    });

    logger.info(`LeaveType created: ${newType.code} by ${user?.email || user?.userId}`);
    return newType;
  },

  updateLeaveType: async (id, data, user) => {
    const type = await LeaveType.findById(id);
    if (!type) throw new AppError('Loại nghỉ phép không tồn tại', 404);

    Object.assign(type, data);
    await type.save();

    logger.info(`LeaveType updated: ${type.code} by ${user?.email || user?.userId}`);
    return type;
  },

  /**
   * 2. Quỹ phép của nhân viên theo năm (My Balances)
   */
  getMyBalances: async (userId, targetYear) => {
    await ensureDefaultLeaveTypes();
    const year = Number(targetYear) || dayjs().year();

    let balanceDoc = await LeaveBalance.findOne({ userId, year }).populate('balances.leaveType');

    if (!balanceDoc) {
      // Khởi tạo LeaveBalance ban đầu cho nhân sự
      const leaveTypes = await LeaveType.find({ isActive: true });
      const balances = leaveTypes.map((lt) => {
        const entitled = lt.maxDaysPerYear || 0;
        return {
          leaveType:  lt._id,
          entitled,
          carryOver:  0,
          adjustment: 0,
          used:       0,
          pending:    0,
          remaining:  entitled,
        };
      });

      balanceDoc = await LeaveBalance.create({
        userId,
        year,
        balances,
      });

      balanceDoc = await LeaveBalance.findById(balanceDoc._id).populate('balances.leaveType');
    }

    return balanceDoc;
  },

  /**
   * 3. Tạo đơn xin nghỉ phép (Create Leave Request)
   */
  createRequest: async (userId, payload) => {
    const {
      leaveTypeId,
      startDate,
      endDate,
      totalDays,
      isHalfDay,
      halfDaySession,
      reason,
      attachments,
    } = payload;

    if (!leaveTypeId || !startDate || !endDate || !reason) {
      throw new AppError('Vui lòng điền đầy đủ loại nghỉ phép, thời gian và lý do nghỉ', 400);
    }

    const calculatedDays = Number(totalDays) || (isHalfDay ? 0.5 : 1);
    if (calculatedDays <= 0) {
      throw new AppError('Số ngày nghỉ phép phải lớn hơn 0', 400);
    }

    const [user, leaveType] = await Promise.all([
      User.findById(userId).populate('department'),
      LeaveType.findById(leaveTypeId),
    ]);

    if (!user) throw new AppError('Nhân viên không tồn tại', 404);
    if (!leaveType || !leaveType.isActive) throw new AppError('Loại nghỉ phép không hợp lệ', 400);

    const year = dayjs(startDate).year();
    const balanceDoc = await leaveService.getMyBalances(userId, year);

    // Kiểm tra số dư nếu là loại phép có giới hạn ngày (như phép năm)
    const typeBalance = balanceDoc.balances.find(
      (b) => b.leaveType?._id?.toString() === leaveTypeId.toString() || b.leaveType?.toString() === leaveTypeId.toString()
    );

    if (leaveType.code === 'annual' && typeBalance) {
      if (typeBalance.remaining < calculatedDays) {
        throw new AppError(
          `Số ngày phép năm còn lại không đủ (còn ${typeBalance.remaining} ngày, bạn đang xin ${calculatedDays} ngày). Vui lòng điều chỉnh hoặc chọn "Nghỉ không lương".`,
          400
        );
      }
    }

    // Xây dựng approvalFlow
    const approvalFlow = [];
    if (user.managerId) {
      approvalFlow.push({
        step: 1,
        approverId: user.managerId,
        approverRole: 'manager',
        status: 'waiting',
      });
    }

    const request = await LeaveRequest.create({
      userId,
      leaveType:       leaveTypeId,
      startDate:       new Date(startDate),
      endDate:         new Date(endDate),
      totalDays:       calculatedDays,
      isHalfDay:       Boolean(isHalfDay),
      halfDaySession:  halfDaySession || null,
      reason:          reason.trim(),
      attachments:     attachments || [],
      status:          'pending',
      approvalFlow,
    });

    // Cập nhật trạng thái đang chờ duyệt (pending) vào LeaveBalance
    if (typeBalance) {
      typeBalance.pending   = (typeBalance.pending || 0) + calculatedDays;
      typeBalance.remaining = Math.max(
        0,
        typeBalance.entitled + typeBalance.carryOver + typeBalance.adjustment - typeBalance.used - typeBalance.pending
      );
      await balanceDoc.save();
    }

    logger.info(`Leave request created by ${user.employeeCode || user.email}: ${calculatedDays} days (${leaveType.name})`);

    return LeaveRequest.findById(request._id)
      .populate('leaveType', 'name code isPaid')
      .populate('userId', 'fullName email employeeCode avatar department')
      .lean();
  },

  /**
   * 4. Lấy danh sách đơn nghỉ phép (My Requests hoặc Toàn công ty cho HR/Manager)
   */
  getRequests: async ({ user, query = {}, skip = 0, limit = 20 }) => {
    const filter = {};

    const isHrOrAdmin = ['super_admin', 'admin', 'hr_manager'].includes(user.roleCode || user.role);

    // Nếu không phải HR / Admin: chỉ xem đơn của mình hoặc đơn của cấp dưới mà mình là Manager
    if (!isHrOrAdmin) {
      if (query.mode === 'approvals') {
        filter['approvalFlow.approverId'] = user.userId;
      } else {
        filter.userId = user.userId;
      }
    } else {
      if (query.userId) filter.userId = query.userId;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.leaveType) {
      filter.leaveType = query.leaveType;
    }

    if (query.startDate || query.endDate) {
      filter.startDate = {};
      if (query.startDate) filter.startDate.$gte = new Date(query.startDate);
      if (query.endDate)   filter.startDate.$lte = new Date(query.endDate);
    }

    const [data, total] = await Promise.all([
      LeaveRequest.find(filter)
        .populate('userId', 'fullName email employeeCode avatar department position')
        .populate({
          path: 'userId',
          populate: [
            { path: 'department', select: 'name code' },
            { path: 'position',   select: 'title code' },
          ],
        })
        .populate('leaveType', 'name code isPaid requiresDocument')
        .populate('approvalFlow.approverId', 'fullName email employeeCode')
        .sort({ createdAt: -1 })
        .skip(Number(skip))
        .limit(Number(limit))
        .lean(),
      LeaveRequest.countDocuments(filter),
    ]);

    return { data, total };
  },

  /**
   * 5. Duyệt đơn nghỉ phép (Approve Request)
   */
  approveRequest: async (requestId, payload, approverUser) => {
    const request = await LeaveRequest.findById(requestId).populate('leaveType');
    if (!request) throw new AppError('Đơn xin nghỉ phép không tồn tại', 404);

    if (request.status !== 'pending') {
      throw new AppError(`Đơn nghỉ phép này đã được xử lý (Trạng thái hiện tại: ${request.status})`, 400);
    }

    // Đánh dấu step của approver
    const approverStep = request.approvalFlow.find(
      (flow) => flow.approverId?.toString() === approverUser.userId?.toString() && flow.status === 'waiting'
    );

    if (approverStep) {
      approverStep.status      = 'approved';
      approverStep.comment     = payload?.comment || 'Đã đồng ý duyệt';
      approverStep.respondedAt = new Date();
    }

    // Kiểm tra xem đơn đã duyệt xong tất cả các cấp chưa hoặc người duyệt là HR Manager
    const isHrOrAdmin = ['super_admin', 'admin', 'hr_manager'].includes(approverUser.roleCode || approverUser.role);
    const hasMoreWaitingSteps = request.approvalFlow.some((flow) => flow.status === 'waiting');

    if (isHrOrAdmin || !hasMoreWaitingSteps) {
      request.status       = 'approved';
      request.approvedDays = request.totalDays;

      // Cập nhật LeaveBalance: trừ pending, tăng used
      const year = dayjs(request.startDate).year();
      const balanceDoc = await LeaveBalance.findOne({ userId: request.userId, year });
      if (balanceDoc) {
        const item = balanceDoc.balances.find(
          (b) => b.leaveType?.toString() === request.leaveType._id.toString()
        );
        if (item) {
          item.pending = Math.max(0, (item.pending || 0) - request.totalDays);
          item.used    = (item.used || 0) + request.totalDays;
          item.remaining = Math.max(
            0,
            item.entitled + item.carryOver + item.adjustment - item.used - item.pending
          );
          await balanceDoc.save();
        }
      }

      // Tự động đồng bộ sang Attendance: ghi nhận các ngày nghỉ phép vào chấm công
      try {
        const start = dayjs(request.startDate);
        const end   = dayjs(request.endDate);
        const daysCount = end.diff(start, 'day') + 1;

        for (let i = 0; i < daysCount; i++) {
          const currentDate = start.add(i, 'day').toDate();
          currentDate.setHours(0, 0, 0, 0);

          // Bỏ qua Thứ 7 và Chủ nhật
          const dayOfWeek = currentDate.getDay();
          if (dayOfWeek === 0 || dayOfWeek === 6) continue;

          await Attendance.findOneAndUpdate(
            { userId: request.userId, date: currentDate },
            {
              userId:              request.userId,
              date:                currentDate,
              status:              'on_leave',
              workUnits:           request.leaveType.isPaid ? (request.isHalfDay ? 0.5 : 1.0) : 0,
              workingHours:        request.leaveType.isPaid ? (request.isHalfDay ? 4.0 : 8.0) : 0,
              note:                `Nghỉ phép: ${request.leaveType.name} (${request.reason})`,
              isManualAdjustment:  false,
            },
            { upsert: true, new: true }
          );
        }
      } catch (attErr) {
        logger.warn(`Failed to auto-create attendance on leave approval: ${attErr.message}`);
      }
    }

    await request.save();
    logger.info(`Leave request ${requestId} approved by ${approverUser.email || approverUser.userId}`);

    return request;
  },

  /**
   * 6. Từ chối đơn nghỉ phép (Reject Request)
   */
  rejectRequest: async (requestId, payload, approverUser) => {
    const request = await LeaveRequest.findById(requestId).populate('leaveType');
    if (!request) throw new AppError('Đơn xin nghỉ phép không tồn tại', 404);

    if (request.status !== 'pending') {
      throw new AppError(`Đơn nghỉ phép này đã được xử lý (Trạng thái: ${request.status})`, 400);
    }

    request.status       = 'rejected';
    request.cancelReason = payload?.reason || 'Quản lý từ chối phê duyệt đơn';

    const approverStep = request.approvalFlow.find(
      (flow) => flow.approverId?.toString() === approverUser.userId?.toString() && flow.status === 'waiting'
    );
    if (approverStep) {
      approverStep.status      = 'rejected';
      approverStep.comment     = payload?.reason || 'Từ chối đơn';
      approverStep.respondedAt = new Date();
    }

    // Hoàn trả số ngày pending về remaining trong LeaveBalance
    const year = dayjs(request.startDate).year();
    const balanceDoc = await LeaveBalance.findOne({ userId: request.userId, year });
    if (balanceDoc) {
      const item = balanceDoc.balances.find(
        (b) => b.leaveType?.toString() === request.leaveType._id.toString()
      );
      if (item) {
        item.pending   = Math.max(0, (item.pending || 0) - request.totalDays);
        item.remaining = Math.max(
          0,
          item.entitled + item.carryOver + item.adjustment - item.used - item.pending
        );
        await balanceDoc.save();
      }
    }

    await request.save();
    logger.info(`Leave request ${requestId} rejected by ${approverUser.email || approverUser.userId}`);

    return request;
  },

  /**
   * 7. Hủy đơn nghỉ phép (bởi chính nhân viên tạo đơn khi còn pending)
   */
  cancelRequest: async (requestId, userId) => {
    const request = await LeaveRequest.findOne({ _id: requestId, userId });
    if (!request) throw new AppError('Đơn xin nghỉ phép không tồn tại', 404);

    if (request.status !== 'pending') {
      throw new AppError('Chỉ có thể hủy đơn xin nghỉ phép khi đơn đang ở trạng thái chờ duyệt', 400);
    }

    request.status       = 'cancelled';
    request.cancelledAt  = new Date();
    request.cancelReason = 'Người làm đơn chủ động hủy';

    // Hoàn trả số ngày pending
    const year = dayjs(request.startDate).year();
    const balanceDoc = await LeaveBalance.findOne({ userId, year });
    if (balanceDoc) {
      const item = balanceDoc.balances.find(
        (b) => b.leaveType?.toString() === request.leaveType?.toString()
      );
      if (item) {
        item.pending   = Math.max(0, (item.pending || 0) - request.totalDays);
        item.remaining = Math.max(
          0,
          item.entitled + item.carryOver + item.adjustment - item.used - item.pending
        );
        await balanceDoc.save();
      }
    }

    await request.save();
    logger.info(`Leave request ${requestId} cancelled by owner: ${userId}`);

    return { message: 'Đã hủy đơn xin nghỉ phép thành công' };
  },
};

module.exports = leaveService;
