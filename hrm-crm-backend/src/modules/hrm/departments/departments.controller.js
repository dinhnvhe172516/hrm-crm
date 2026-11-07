'use strict';

const service = require('./departments.service');
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

const getTree = async (req, res, next) => {
  try {
    const data = await service.getTree();
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
    successResponse(res, data, 'Tạo phòng ban thành công', 201);
  } catch (e) {
    next(e);
  }
};

const update = async (req, res, next) => {
  try {
    const data = await service.update(req.params.id, req.body, req.user);
    successResponse(res, data, 'Cập nhật phòng ban thành công');
  } catch (e) {
    next(e);
  }
};

const remove = async (req, res, next) => {
  try {
    const data = await service.remove(req.params.id, req.user);
    successResponse(res, data, 'Xóa phòng ban thành công');
  } catch (e) {
    next(e);
  }
};

module.exports = { getAll, getTree, getById, create, update, remove };
