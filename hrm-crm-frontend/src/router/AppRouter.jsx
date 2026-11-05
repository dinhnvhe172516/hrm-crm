import { Routes, Route, Navigate } from 'react-router-dom'
import { Suspense } from 'react'
import ProtectedRoute from './ProtectedRoute'
import MainLayout from '@/components/layout/MainLayout/MainLayout'
import PageLoader from '@/components/common/PageLoader/PageLoader'
import {
  // Eager
  LoginPage, ForgotPasswordPage, DashboardPage,
  // Auth lazy
  VerifyEmailPage, ResetPasswordPage,
  // Error lazy
  ForbiddenPage,
  // HRM
  RolesPage, EmployeesPage, DepartmentsPage, AttendancePage,
  LeavePage, PayrollPage, TasksPage, MeetingsPage,
  // CRM
  CompaniesPage, ContactsPage, LeadsPage, PipelinePage,
  ActivitiesPage, QuotationsPage, InvoicesPage, TicketsPage,
} from './pages'

/** Wrap lazy page trong Suspense — đặt trong element prop, không phải Routes child */
const LazyPage = ({ Page }) => (
  <Suspense fallback={<PageLoader />}>
    <Page />
  </Suspense>
)

/** Wrap trang có yêu cầu quyền hạn */
const GuardedPage = ({ Page, permission, role }) => (
  <ProtectedRoute requiredPermission={permission} requiredRole={role}>
    <LazyPage Page={Page} />
  </ProtectedRoute>
)

export default function AppRouter() {
  return (
    <Routes>

      {/* ── Public / Auth ──────────────────────────────────────── */}
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register"         element={<LoginPage initialTab="register" />} />
      <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
      <Route path="/reset-password"   element={<LazyPage Page={ResetPasswordPage} />} />
      <Route path="/verify-email"     element={<LazyPage Page={VerifyEmailPage} />} />
      <Route path="/403"              element={<LazyPage Page={ForbiddenPage} />} />

      {/* ── Protected ─────────────────────────────────────────── */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* HRM */}
        <Route path="hrm">
          <Route path="roles"       element={<GuardedPage Page={RolesPage} permission="system:read" />} />
          <Route path="employees"   element={<GuardedPage Page={EmployeesPage} permission="employee:read" />} />
          <Route path="departments" element={<GuardedPage Page={DepartmentsPage} permission="department:read" />} />
          <Route path="attendance"  element={<GuardedPage Page={AttendancePage} permission="attendance:read" />} />
          <Route path="leave"       element={<GuardedPage Page={LeavePage} permission="leave:read" />} />
          <Route path="payroll"     element={<GuardedPage Page={PayrollPage} permission="payroll:read" />} />
          <Route path="tasks"       element={<GuardedPage Page={TasksPage} permission="task:read" />} />
          <Route path="meetings"    element={<GuardedPage Page={MeetingsPage} permission="meeting:read" />} />
        </Route>

        {/* CRM */}
        <Route path="crm">
          <Route path="companies"  element={<GuardedPage Page={CompaniesPage} permission="crm_company:read" />} />
          <Route path="contacts"   element={<GuardedPage Page={ContactsPage} permission="crm_contact:read" />} />
          <Route path="leads"      element={<GuardedPage Page={LeadsPage} permission="crm_lead:read" />} />
          <Route path="pipeline"   element={<GuardedPage Page={PipelinePage} permission="crm_opportunity:read" />} />
          <Route path="activities" element={<GuardedPage Page={ActivitiesPage} permission="crm_activity:read" />} />
          <Route path="quotations" element={<GuardedPage Page={QuotationsPage} permission="crm_quotation:read" />} />
          <Route path="invoices"   element={<GuardedPage Page={InvoicesPage} permission="crm_invoice:read" />} />
          <Route path="tickets"    element={<GuardedPage Page={TicketsPage} permission="crm_ticket:read" />} />
        </Route>
      </Route>

      {/* ── Fallback ──────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  )
}
