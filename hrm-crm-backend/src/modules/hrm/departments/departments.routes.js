'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./departments.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize }    = require('../../../middlewares/rbac.middleware');

router.use(authenticate);

router.get('/tree',     authorize('department:read'),   controller.getTree);
router.get('/',         authorize('department:read'),   controller.getAll);
router.get('/:id',      authorize('department:read'),   controller.getById);
router.post('/',        authorize('department:create'), controller.create);
router.put('/:id',      authorize('department:update'), controller.update);
router.delete('/:id',   authorize('department:delete'), controller.remove);

module.exports = router;
