'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./users.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize }    = require('../../../middlewares/rbac.middleware');

router.use(authenticate);

router.get('/stats',               authorize('employee:read'),   controller.getStats);
router.get('/',                    authorize('employee:read'),   controller.getAll);
router.get('/:id',                 authorize('employee:read'),   controller.getById);
router.post('/',                   authorize('employee:create'), controller.create);
router.put('/:id',                 authorize('employee:update'), controller.update);
router.post('/:id/reset-password', authorize('employee:update'), controller.resetPassword);
router.delete('/:id',              authorize('employee:delete'), controller.remove);

module.exports = router;
