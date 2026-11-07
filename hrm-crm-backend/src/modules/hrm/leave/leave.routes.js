'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./leave.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize }    = require('../../../middlewares/rbac.middleware');

router.use(authenticate);

// ── Loại nghỉ phép (LeaveTypes) ────────────────────────────────
router.get('/types',                    controller.getLeaveTypes);
router.post('/types',                   authorize('leave:create'), controller.createLeaveType);
router.put('/types/:id',                authorize('leave:update'), controller.updateLeaveType);

// ── Quỹ phép cá nhân (LeaveBalances) ───────────────────────────
router.get('/balances/my',              controller.getMyBalances);

// ── Đơn xin nghỉ phép (LeaveRequests) ──────────────────────────
router.post('/requests',                controller.createRequest);
router.get('/requests',                 controller.getRequests);
router.put('/requests/:id/cancel',      controller.cancelRequest);

// ── Phê duyệt đơn (Approvals) ──────────────────────────────────
router.put('/requests/:id/approve',     authorize('leave:approve', 'leave:update'), controller.approveRequest);
router.put('/requests/:id/reject',      authorize('leave:reject', 'leave:update'),  controller.rejectRequest);

module.exports = router;
