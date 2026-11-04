import { Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

/**
 * Route guard — chỉ cho phép user đã xác thực đi vào protected routes.
 * Nếu chưa auth → redirect về /login.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, accessToken } = useAuthStore()
  return (isAuthenticated && accessToken)
    ? children
    : <Navigate to="/login" replace />
}
