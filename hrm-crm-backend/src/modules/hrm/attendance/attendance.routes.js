'use strict';

const express = require('express');
const router = express.Router();
const controller = require('./attendance.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const { authorize }    = require('../../../middlewares/rbac.middleware');

router.use(authenticate);

// ── Nhân viên cá nhân ──────────────────────────────────────────
router.post('/check-in',        controller.checkIn);
router.post('/check-out',       controller.checkOut);
router.get('/today',            controller.getTodayStatus);
router.get('/my-timesheet',     controller.getMyTimesheet);

// ── Ca làm việc (WorkShifts) ───────────────────────────────────
router.get('/shifts',           authorize('attendance:read'),   controller.getShifts);
router.post('/shifts',          authorize('attendance:create'), controller.createShift);
router.put('/shifts/:id',       authorize('attendance:update'), controller.updateShift);
router.delete('/shifts/:id',    authorize('attendance:delete'), controller.deleteShift);

// ── Quản lý Chấm công (HR / Manager) ───────────────────────────
router.get('/',                 authorize('attendance:read'),   controller.getAll);
router.put('/:id/adjust',       authorize('attendance:update'), controller.adjustAttendance);

module.exports = router;
