'use strict';

const service = require('./attendance.service');
const { successResponse, paginatedResponse } = require('../../../shared/utils/response');
const { getPagination, buildPaginationMeta } = require('../../../shared/helpers/pagination');

const checkIn = async (req, res, next) => {
  try {
    const data = await service.checkIn(req.user.userId, req.body, req);
    successResponse(res, data, data?.message || 'Check-in thành công');
  } catch (e) {
    next(e);
  }
};

const checkOut = async (req, res, next) => {
  try {
    const data = await service.checkOut(req.user.userId, req.body, req);
    successResponse(res, data, data?.message || 'Check-out thành công');
  } catch (e) {
    next(e);
  }
};

const getTodayStatus = async (req, res, next) => {
  try {
    const data = await service.getTodayStatus(req.user.userId);
    successResponse(res, data);
  } catch (e) {
    next(e);
  }
};

const getMyTimesheet = async (req, res, next) => {
  try {
    const data = await service.getMyTimesheet(req.user.userId, req.query);
    successResponse(res, data);
  } catch (e) {
    next(e);
  }
};

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { data, total } = await service.getAll({ skip, limit, query: req.query });
    paginatedResponse(res, data, buildPaginationMeta(total, page, limit));
  } catch (e) {
    next(e);
  }
};

const adjustAttendance = async (req, res, next) => {
  try {
    const data = await service.adjustAttendance(req.params.id, req.body, req.user);
    successResponse(res, data, 'Điều chỉnh chấm công thành công');
  } catch (e) {
    next(e);
  }
};

const getShifts = async (req, res, next) => {
  try {
    const data = await service.getShifts();
    successResponse(res, data);
  } catch (e) {
    next(e);
  }
};

const createShift = async (req, res, next) => {
  try {
    const data = await service.createShift(req.body, req.user);
    successResponse(res, data, 'Tạo ca làm việc thành công', 201);
  } catch (e) {
    next(e);
  }
};

const updateShift = async (req, res, next) => {
  try {
    const data = await service.updateShift(req.params.id, req.body, req.user);
    successResponse(res, data, 'Cập nhật ca làm việc thành công');
  } catch (e) {
    next(e);
  }
};

const deleteShift = async (req, res, next) => {
  try {
    const data = await service.deleteShift(req.params.id, req.user);
    successResponse(res, data, 'Xóa ca làm việc thành công');
  } catch (e) {
    next(e);
  }
};

module.exports = {
  checkIn,
  checkOut,
  getTodayStatus,
  getMyTimesheet,
  getAll,
  adjustAttendance,
  getShifts,
  createShift,
  updateShift,
  deleteShift,
};
