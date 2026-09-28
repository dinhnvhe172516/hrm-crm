export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  HR_MANAGER: 'hr_manager',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
}

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  DONE: 'done',
  CANCELLED: 'cancelled',
}

export const TASK_STATUS_LABELS = {
  todo: 'Cần làm',
  in_progress: 'Đang làm',
  review: 'Đang review',
  done: 'Hoàn thành',
  cancelled: 'Đã huỷ',
}

export const PRIORITY_COLORS = {
  low: 'green',
  medium: 'blue',
  high: 'orange',
  urgent: 'red',
}

export const LEAVE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
}

export const CRM_LEAD_TEMP = {
  COLD: 'cold',
  WARM: 'warm',
  HOT: 'hot',
}
