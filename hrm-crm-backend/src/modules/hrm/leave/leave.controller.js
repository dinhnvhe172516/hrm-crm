'use strict';

const service = require('./leave.service');
const { successResponse, paginatedResponse } = require('../../../shared/utils/response');
const { getPagination, buildPaginationMeta } = require('../../../shared/helpers/pagination');

const getLeaveTypes = async (req, res, next) => {
  try {
    const data = await service.getLeaveTypes();
    successResponse(res, data);
  } catch (e) {
    next(e);
  }
};

const createLeaveType = async (req, res, next) => {
  try {
    const data = await service.createLeaveType(req.body, req.user);
    successResponse(res, data, 'Tạo loại nghỉ phép thành công', 201);
  } catch (e) {
    next(e);
  }
};

const updateLeaveType = async (req, res, next) => {
  try {
    const data = await service.updateLeaveType(req.params.id, req.body, req.user);
    successResponse(res, data, 'Cập nhật loại nghỉ phép thành công');
  } catch (e) {
    next(e);
  }
};

const getMyBalances = async (req, res, next) => {
  try {
    const data = await service.getMyBalances(req.user.userId, req.query.year);
    successResponse(res, data);
  } catch (e) {
    next(e);
  }
};

const createRequest = async (req, res, next) => {
  try {
    const data = await service.createRequest(req.user.userId, req.body);
    successResponse(res, data, 'Tạo đơn xin nghỉ phép thành công', 201);
  } catch (e) {
    next(e);
  }
};

const getRequests = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { data, total } = await service.getRequests({
      user:  req.user,
      query: req.query,
      skip,
      limit,
    });
    paginatedResponse(res, data, buildPaginationMeta(total, page, limit));
  } catch (e) {
    next(e);
  }
};

const approveRequest = async (req, res, next) => {
  try {
    const data = await service.approveRequest(req.params.id, req.body, req.user);
    successResponse(res, data, 'Duyệt đơn nghỉ phép thành công');
  } catch (e) {
    next(e);
  }
};

const rejectRequest = async (req, res, next) => {
  try {
    const data = await service.rejectRequest(req.params.id, req.body, req.user);
    successResponse(res, data, 'Từ chối đơn nghỉ phép thành công');
  } catch (e) {
    next(e);
  }
};

const cancelRequest = async (req, res, next) => {
  try {
    const data = await service.cancelRequest(req.params.id, req.user.userId);
    successResponse(res, data, 'Hủy đơn nghỉ phép thành công');
  } catch (e) {
    next(e);
  }
};

module.exports = {
  getLeaveTypes,
  createLeaveType,
  updateLeaveType,
  getMyBalances,
  createRequest,
  getRequests,
  approveRequest,
  rejectRequest,
  cancelRequest,
};
