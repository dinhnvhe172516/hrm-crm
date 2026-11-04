const express = require('express');
const router = express.Router();

router.use('/auth',               require('../modules/hrm/auth/auth.routes'));
router.use('/roles',              require('../modules/hrm/roles/roles.routes'));
router.use('/users',              require('../modules/hrm/users/users.routes'));
router.use('/departments',        require('../modules/hrm/departments/departments.routes'));
router.use('/groups',             require('../modules/hrm/groups/groups.routes'));
router.use('/positions',          require('../modules/hrm/positions/positions.routes'));
router.use('/attendance',         require('../modules/hrm/attendance/attendance.routes'));
router.use('/leave',              require('../modules/hrm/leave/leave.routes'));
router.use('/payroll',            require('../modules/hrm/payroll/payroll.routes'));
router.use('/tasks',              require('../modules/hrm/tasks/tasks.routes'));
router.use('/meetings',           require('../modules/hrm/meetings/meetings.routes'));
router.use('/notifications',      require('../modules/hrm/notifications/notifications.routes'));
router.use('/announcements',      require('../modules/hrm/announcements/announcements.routes'));
router.use('/documents',          require('../modules/hrm/documents/documents.routes'));
router.use('/performance',        require('../modules/hrm/performance/performance.routes'));
router.use('/training',           require('../modules/hrm/training/training.routes'));
router.use('/onboarding',         require('../modules/hrm/onboarding/onboarding.routes'));
router.use('/expense',            require('../modules/hrm/expense/expense.routes'));
router.use('/discipline',         require('../modules/hrm/discipline/discipline.routes'));
router.use('/contracts',          require('../modules/hrm/contracts/contracts.routes'));
router.use('/assets',             require('../modules/hrm/assets/assets.routes'));

router.use('/crm/companies',      require('../modules/crm/companies/companies.routes'));
router.use('/crm/contacts',       require('../modules/crm/contacts/contacts.routes'));
router.use('/crm/leads',          require('../modules/crm/leads/leads.routes'));
router.use('/crm/pipelines',      require('../modules/crm/pipelines/pipelines.routes'));
router.use('/crm/opportunities',  require('../modules/crm/opportunities/opportunities.routes'));
router.use('/crm/activities',     require('../modules/crm/activities/activities.routes'));
router.use('/crm/products',       require('../modules/crm/products/products.routes'));
router.use('/crm/quotations',     require('../modules/crm/quotations/quotations.routes'));
router.use('/crm/contracts',      require('../modules/crm/contracts/contracts.routes'));
router.use('/crm/invoices',       require('../modules/crm/invoices/invoices.routes'));
router.use('/crm/campaigns',      require('../modules/crm/campaigns/campaigns.routes'));
router.use('/crm/commissions',    require('../modules/crm/commissions/commissions.routes'));
router.use('/crm/tickets',        require('../modules/crm/tickets/tickets.routes'));

router.use('/reports',            require('../modules/reports/reports.routes'));

module.exports = router;
