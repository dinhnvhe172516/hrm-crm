import { Navigate, useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'
import { usePermission } from '@/hooks/usePermission'

/**
 * Route guard — bảo vệ route theo xác thực (Auth) và phân quyền (Permission / Role).
 * - Chưa login -> redirect về /login.
 * - Đã login nhưng thiếu quyền -> redirect về /403.
 */
export default function ProtectedRoute({
  children,
  requiredPermission,
  requiredPermissions,
  requiredRole,
}) {
  const { isAuthenticated, accessToken } = useAuthStore()
  const { hasPermission, hasAnyPermission, hasRole } = usePermission()
  const location = useLocation()

  // 1. Kiểm tra xác thực đăng nhập
  if (!isAuthenticated || !accessToken) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // 2. Kiểm tra vai trò (Role)
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/403" replace />
  }

  // 3. Kiểm tra quyền đơn lẻ (Permission)
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/403" replace />
  }

  // 4. Kiểm tra danh sách quyền
  if (requiredPermissions && requiredPermissions.length > 0 && !hasAnyPermission(requiredPermissions)) {
    return <Navigate to="/403" replace />
  }

  return children
}
