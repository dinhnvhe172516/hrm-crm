import { lazy } from 'react'

// ── Eager (cần ngay khi app load) ────────────────────────────
export { default as LoginPage }          from '@/pages/auth/Login/Login'
export { default as ForgotPasswordPage } from '@/pages/auth/ForgotPassword/ForgotPassword'
export { default as DashboardPage }      from '@/pages/dashboard/Dashboard'

// ── Auth module (lazy) ────────────────────────────────────────
export const VerifyEmailPage   = lazy(() => import('@/pages/auth/VerifyEmail/VerifyEmail'))
export const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPassword/ResetPassword'))

// ── Error pages (lazy) ─────────────────────────────────────────
export const ForbiddenPage      = lazy(() => import('@/pages/error/ForbiddenPage'))

// ── HRM module (lazy) ─────────────────────────────────────────
export const RolesPage         = lazy(() => import('@/pages/hrm/roles/Roles'))
export const EmployeesPage   = lazy(() => import('@/pages/hrm/employees/Employees'))
export const DepartmentsPage = lazy(() => import('@/pages/hrm/departments/Departments'))
export const AttendancePage  = lazy(() => import('@/pages/hrm/attendance/Attendance'))
export const LeavePage       = lazy(() => import('@/pages/hrm/leave/Leave'))
export const PayrollPage     = lazy(() => import('@/pages/hrm/payroll/Payroll'))
export const TasksPage       = lazy(() => import('@/pages/hrm/tasks/Tasks'))
export const MeetingsPage    = lazy(() => import('@/pages/hrm/meetings/Meetings'))

// ── CRM module (lazy) ─────────────────────────────────────────
export const CompaniesPage  = lazy(() => import('@/pages/crm/companies/Companies'))
export const ContactsPage   = lazy(() => import('@/pages/crm/contacts/Contacts'))
export const LeadsPage      = lazy(() => import('@/pages/crm/leads/Leads'))
export const PipelinePage   = lazy(() => import('@/pages/crm/pipeline/Pipeline'))
export const ActivitiesPage = lazy(() => import('@/pages/crm/activities/Activities'))
export const QuotationsPage = lazy(() => import('@/pages/crm/quotations/Quotations'))
export const InvoicesPage   = lazy(() => import('@/pages/crm/invoices/Invoices'))
export const TicketsPage    = lazy(() => import('@/pages/crm/tickets/Tickets'))
