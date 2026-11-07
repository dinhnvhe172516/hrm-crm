'use strict';

const service = require('./users.service');
const { successResponse, paginatedResponse } = require('../../../shared/utils/response');
const { getPagination, buildPaginationMeta } = require('../../../shared/helpers/pagination');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { data, total } = await service.getAll({ skip, limit, query: req.query });
    paginatedResponse(res, data, buildPaginationMeta(total, page, limit));
  } catch (e) {
    next(e);
  }
};

const getStats = async (req, res, next) => {
  try {
    const data = await service.getStats();
    successResponse(res, data);
  } catch (e) {
    next(e);
  }
};

const getById = async (req, res, next) => {
  try {
    const data = await service.getById(req.params.id);
    successResponse(res, data);
  } catch (e) {
    next(e);
  }
};

const create = async (req, res, next) => {
  try {
    const data = await service.create(req.body, req.user);
    successResponse(res, data, 'Tạo nhân viên thành công', 201);
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user);
    successResponse(res, data, 'Cập nhật thông tin nhân viên thành công');
  } catch (e) {
    next(e);
  }
};

const resetPassword = async (req, res, next) => {
  try {
    const data = await service.resetPassword(req.params.id, req.body, req.user);
    successResponse(res, data, data?.message || 'Đặt lại mật khẩu thành công');
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const data = await service.remove(req.params.id, req.user);
    successResponse(res, data, 'Vô hiệu hóa tài khoản thành công');
  } catch (e) {
    next(e);
  }
};

module.exports = { getAll, getStats, getById, create, update, resetPassword, remove };
