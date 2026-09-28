const service = require('./expense.service');
const { successResponse, paginatedResponse } = require('../../../shared/utils/response');
const { getPagination, buildPaginationMeta } = require('../../../shared/helpers/pagination');

const getAll  = async (req, res, next) => { try { const { page, limit, skip } = getPagination(req.query); const { data, total } = await service.getAll({ skip, limit, query: req.query }); paginatedResponse(res, data, buildPaginationMeta(total, page, limit)); } catch (e) { next(e); } };
const create  = async (req, res, next) => { try { const data = await service.create(req.body, req.user); successResponse(res, data, 'Created successfully', 201); } catch (e) { next(e); } };
const getById = async (req, res, next) => { try { const data = await service.getById(req.params.id); successResponse(res, data); } catch (e) { next(e); } };
const update  = async (req, res, next) => { try { const data = await service.update(req.params.id, req.body, req.user); successResponse(res, data, 'Updated successfully'); } catch (e) { next(e); } };
const remove  = async (req, res, next) => { try { await service.remove(req.params.id, req.user); successResponse(res, null, 'Deleted successfully'); } catch (e) { next(e); } };

module.exports = { getAll, create, getById, update, remove };
