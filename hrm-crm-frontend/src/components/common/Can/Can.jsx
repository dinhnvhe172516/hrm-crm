import { usePermission } from '@/hooks/usePermission'

/**
 * Component kiểm soát hiển thị giao diện theo quyền (Conditional Render Guard)
 *
 * Cách dùng:
 * <Can do="employee:create">
 *   <Button type="primary">Thêm nhân viên</Button>
 * </Can>
 *
 * <Can role={['super_admin', 'hr_manager']} fallback={<p>Không có quyền</p>}>
 *   <AdminActionPanel />
 * </Can>
 */
export default function Can({
  do: requiredPermission,
  any: requiredAnyPermissions,
  all: requiredAllPermissions,
  role: requiredRole,
  fallback = null,
  children,
}) {
  const { hasPermission, hasAnyPermission, hasAllPermissions, hasRole } = usePermission()

  // Kiểm tra vai trò
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback
  }

  // Kiểm tra quyền đơn
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return fallback
  }

  // Kiểm tra ít nhất 1 quyền
  if (requiredAnyPermissions && !hasAnyPermission(requiredAnyPermissions)) {
    return fallback
  }

  // Kiểm tra tất cả quyền
  if (requiredAllPermissions && !hasAllPermissions(requiredAllPermissions)) {
    return fallback
  }

  return children
}

