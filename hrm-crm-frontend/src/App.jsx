import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import MainLayout from '@/components/layout/MainLayout/MainLayout'

// Auth pages
import LoginPage from '@/pages/auth/Login/Login'
import ForgotPasswordPage from '@/pages/auth/ForgotPassword/ForgotPassword'

// HRM pages
import DashboardPage from '@/pages/dashboard/Dashboard'

// Lazy loading for better performance
import { lazy, Suspense } from 'react'
const EmployeesPage    = lazy(() => import('@/pages/hrm/employees/Employees'))
const DepartmentsPage  = lazy(() => import('@/pages/hrm/departments/Departments'))
const AttendancePage   = lazy(() => import('@/pages/hrm/attendance/Attendance'))
const LeavePage        = lazy(() => import('@/pages/hrm/leave/Leave'))
const PayrollPage      = lazy(() => import('@/pages/hrm/payroll/Payroll'))
const TasksPage        = lazy(() => import('@/pages/hrm/tasks/Tasks'))
const MeetingsPage     = lazy(() => import('@/pages/hrm/meetings/Meetings'))

// CRM pages
const CompaniesPage    = lazy(() => import('@/pages/crm/companies/Companies'))
const ContactsPage     = lazy(() => import('@/pages/crm/contacts/Contacts'))
const LeadsPage        = lazy(() => import('@/pages/crm/leads/Leads'))
const PipelinePage     = lazy(() => import('@/pages/crm/pipeline/Pipeline'))
const ActivitiesPage   = lazy(() => import('@/pages/crm/activities/Activities'))
const QuotationsPage   = lazy(() => import('@/pages/crm/quotations/Quotations'))
const InvoicesPage     = lazy(() => import('@/pages/crm/invoices/Invoices'))
const TicketsPage      = lazy(() => import('@/pages/crm/tickets/Tickets'))

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

const LoadingFallback = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
  </div>
)

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected */}
      <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* HRM */}
        <Suspense fallback={<LoadingFallback />}>
          <Route path="hrm">
            <Route path="employees"  element={<EmployeesPage />} />
            <Route path="departments" element={<DepartmentsPage />} />
            <Route path="attendance" element={<AttendancePage />} />
            <Route path="leave"      element={<LeavePage />} />
            <Route path="payroll"    element={<PayrollPage />} />
            <Route path="tasks"      element={<TasksPage />} />
            <Route path="meetings"   element={<MeetingsPage />} />
          </Route>

          {/* CRM */}
          <Route path="crm">
            <Route path="companies"   element={<CompaniesPage />} />
            <Route path="contacts"    element={<ContactsPage />} />
            <Route path="leads"       element={<LeadsPage />} />
            <Route path="pipeline"    element={<PipelinePage />} />
            <Route path="activities"  element={<ActivitiesPage />} />
            <Route path="quotations"  element={<QuotationsPage />} />
            <Route path="invoices"    element={<InvoicesPage />} />
            <Route path="tickets"     element={<TicketsPage />} />
          </Route>
        </Suspense>
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

export default App
