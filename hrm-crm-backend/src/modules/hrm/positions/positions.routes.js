'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./positions.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize }    = require('../../../middlewares/rbac.middleware');

router.use(authenticate);

router.get('/',         authorize('department:read', 'employee:read'),   controller.getAll);
router.get('/:id',      authorize('department:read', 'employee:read'),   controller.getById);
router.post('/',        authorize('department:create', 'employee:create'), controller.create);
router.put('/:id',      authorize('department:update', 'employee:update'), controller.update);
router.delete('/:id',   authorize('department:delete', 'employee:delete'), controller.remove);

module.exports = router;
