'use strict';

const service = require('./payroll.service');
const { successResponse, paginatedResponse } = require('../../../shared/utils/response');
const { getPagination, buildPaginationMeta } = require('../../../shared/helpers/pagination');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { data, total, totalGross, totalNet } = await service.getAll({
      skip,
      limit,
      query: req.query,
    });
    const meta = buildPaginationMeta(total, page, limit);
    meta.totalGross = totalGross;
    meta.totalNet = totalNet;
    paginatedResponse(res, data, meta);
  } catch (e) {
    next(e);
  }
};

const getMyPayslip = async (req, res, next) => {
  try {
    const data = await service.getMyPayslip(req.user.userId, req.query);
    successResponse(res, data);
  } catch (e) {
    next(e);
  }
};

const generateMonthlyPayroll = async (req, res, next) => {
  try {
    const data = await service.generateMonthlyPayroll(req.body, req.user);
    successResponse(res, data, 'Tính toán bảng lương tháng thành công');
  } catch (e) {
    next(e);
  }
};

const approvePayroll = async (req, res, next) => {
  try {
    const data = await service.approvePayroll(req.params.id, req.user);
    successResponse(res, data, 'Phê duyệt bảng lương thành công');
  } catch (e) {
    next(e);
  }
};

const markAsPaid = async (req, res, next) => {
  try {
    const data = await service.markAsPaid(req.params.id, req.body, req.user);
    successResponse(res, data, 'Xác nhận chi trả lương thành công');
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getAll,
  getMyPayslip,
  generateMonthlyPayroll,
  approvePayroll,
  markAsPaid,
};
