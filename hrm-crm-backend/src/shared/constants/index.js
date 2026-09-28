module.exports = {
  ROLES: {
    SUPER_ADMIN: 'super_admin',
    HR_MANAGER: 'hr_manager',
    MANAGER: 'manager',
    EMPLOYEE: 'employee',
  },
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
  },
  LEAVE_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    CANCELLED: 'cancelled',
  },
  TASK_STATUS: {
    TODO: 'todo',
    IN_PROGRESS: 'in_progress',
    REVIEW: 'review',
    DONE: 'done',
    CANCELLED: 'cancelled',
  },
  CRM_LEAD_STATUS: {
    NEW: 'new',
    CONTACTED: 'contacted',
    QUALIFIED: 'qualified',
    CONVERTED: 'converted',
    DISQUALIFIED: 'disqualified',
  },
  NOTIFICATION_TYPES: {
    TASK_ASSIGNED: 'task_assigned',
    TASK_UPDATED: 'task_updated',
    MEETING_INVITE: 'meeting_invite',
    LEAVE_APPROVED: 'leave_approved',
    LEAVE_REJECTED: 'leave_rejected',
    PAYSLIP: 'payslip',
    ANNOUNCEMENT: 'announcement',
  },
};
