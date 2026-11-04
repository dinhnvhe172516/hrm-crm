'use strict';

const rolesService = require('./roles.service');
const { successResponse, paginatedResponse } = require('../../../shared/utils/response');
const { getPagination, buildPaginationMeta } = require('../../../shared/helpers/pagination');

const getAll = async (req, res, next) => {
  try {
    const { page, limit, skip } = getPagination(req.query);
    const { data, total } = await rolesService.getAll({ skip, limit, query: req.query });
    paginatedResponse(res, data, buildPaginationMeta(total, page, limit));
  } catch (error) {
    next(error);
  }
};

const getById = async (req, res, next) => {
  try {
    const role = await rolesService.getById(req.params.id);
    successResponse(res, role);
  } catch (error) {
    next(error);
  }
};

const create = async (req, res, next) => {
  try {
    const role = await rolesService.create(req.body);
    successResponse(res, role, 'Tạo vai trò thành công', 201);
  } catch (error) {
    next(error);
  }
};

const update = async (req, res, next) => {
  try {
    const role = await rolesService.update(req.params.id, req.body);
    successResponse(res, role, 'Cập nhật vai trò thành công');
  } catch (error) {
    next(error);
  }
};

const remove = async (req, res, next) => {
  try {
    await rolesService.remove(req.params.id);
    successResponse(res, null, 'Xóa vai trò thành công');
  } catch (error) {
    next(error);
  }
};

const getPermissions = async (req, res, next) => {
  try {
    const data = await rolesService.getPermissionsGrouped();
    successResponse(res, data);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAll,
  getById,
  create,
  update,
  remove,
  getPermissions,
};

