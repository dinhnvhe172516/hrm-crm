'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./payroll.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize }    = require('../../../middlewares/rbac.middleware');

router.use(authenticate);

// ── Nhân viên cá nhân ──────────────────────────────────────────
router.get('/my-payslip',       controller.getMyPayslip);

// ── Quản lý Lương (HR / Kế toán / BOD) ─────────────────────────
router.get('/',                 authorize('payroll:read'),                    controller.getAll);
router.post('/generate',        authorize('payroll:create', 'payroll:approve'), controller.generateMonthlyPayroll);
router.put('/:id/approve',      authorize('payroll:approve'),                 controller.approvePayroll);
router.put('/:id/pay',          authorize('payroll:approve', 'payroll:update'), controller.markAsPaid);

module.exports = router;
