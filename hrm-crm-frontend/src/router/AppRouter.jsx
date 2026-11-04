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
  // HRM
  EmployeesPage, DepartmentsPage, AttendancePage,
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

export default function AppRouter() {
  return (
    <Routes>

      {/* ── Public / Auth ──────────────────────────────────────── */}
      <Route path="/login"            element={<LoginPage />} />
      <Route path="/register"         element={<LoginPage initialTab="register" />} />
      <Route path="/forgot-password"  element={<ForgotPasswordPage />} />
      <Route path="/reset-password"   element={<LazyPage Page={ResetPasswordPage} />} />
      <Route path="/verify-email"     element={<LazyPage Page={VerifyEmailPage} />} />

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
          <Route path="employees"   element={<LazyPage Page={EmployeesPage} />} />
          <Route path="departments" element={<LazyPage Page={DepartmentsPage} />} />
          <Route path="attendance"  element={<LazyPage Page={AttendancePage} />} />
          <Route path="leave"       element={<LazyPage Page={LeavePage} />} />
          <Route path="payroll"     element={<LazyPage Page={PayrollPage} />} />
          <Route path="tasks"       element={<LazyPage Page={TasksPage} />} />
          <Route path="meetings"    element={<LazyPage Page={MeetingsPage} />} />
        </Route>

        {/* CRM */}
        <Route path="crm">
          <Route path="companies"  element={<LazyPage Page={CompaniesPage} />} />
          <Route path="contacts"   element={<LazyPage Page={ContactsPage} />} />
          <Route path="leads"      element={<LazyPage Page={LeadsPage} />} />
          <Route path="pipeline"   element={<LazyPage Page={PipelinePage} />} />
          <Route path="activities" element={<LazyPage Page={ActivitiesPage} />} />
          <Route path="quotations" element={<LazyPage Page={QuotationsPage} />} />
          <Route path="invoices"   element={<LazyPage Page={InvoicesPage} />} />
          <Route path="tickets"    element={<LazyPage Page={TicketsPage} />} />
        </Route>
      </Route>

      {/* ── Fallback ──────────────────────────────────────────── */}
      <Route path="*" element={<Navigate to="/login" replace />} />

    </Routes>
  )
}
