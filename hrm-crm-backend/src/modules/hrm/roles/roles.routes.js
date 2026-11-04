'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./roles.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize, authorizeRoles } = require('../../../middlewares/rbac.middleware');

// Mọi route về Roles đều yêu cầu xác thực
router.use(authenticate);

// Danh mục Permissions (cho form tạo/sửa role)
router.get('/permissions', authorize('system:read'), controller.getPermissions);

// CRUD Roles
router.get('/',     authorize('system:read'), controller.getAll);
router.post('/',    authorize('system:create'), controller.create);
router.get('/:id',  authorize('system:read'), controller.getById);
router.put('/:id',  authorize('system:update'), controller.update);
router.delete('/:id', authorize('system:delete'), controller.remove);

module.exports = router;

