import { useMemo } from 'react'
import { useAuthStore } from '@/store/auth.store'

/**
 * Hook kiểm tra vai trò và quyền hạn (RBAC / PBAC) phía Frontend
 */
export function usePermission() {
  const user = useAuthStore((state) => state.user)

  const userRole = user?.role?.code || ''
  const isSuperAdmin = userRole === 'super_admin' || (user?.permissions || []).includes('*')
  const permissions = useMemo(() => user?.permissions || [], [user?.permissions])

  /**
   * Kiểm tra quyền cụ thể (hỗ trợ wildcard '*' và 'module:*')
   * @param {string} permission - Ví dụ: 'employee:read', 'leave:approve'
   */
  const hasPermission = (permission) => {
    if (!permission) return true
    if (isSuperAdmin) return true
    if (permissions.includes('*')) return true
    if (permissions.includes(permission)) return true

    // Kiểm tra wildcard module (VD: 'employee:*' khớp với 'employee:read')
    const [moduleName] = permission.split(':')
    if (permissions.includes(`${moduleName}:*`)) return true

    return false
  }

  /**
   * Kiểm tra user có ít nhất 1 quyền trong danh sách không
   * @param {string[]} perms
   */
  const hasAnyPermission = (perms = []) => {
    if (!perms || perms.length === 0) return true
    if (isSuperAdmin) return true
    return perms.some((p) => hasPermission(p))
  }

  /**
   * Kiểm tra user có tất cả các quyền trong danh sách không
   * @param {string[]} perms
   */
  const hasAllPermissions = (perms = []) => {
    if (!perms || perms.length === 0) return true
    if (isSuperAdmin) return true
    return perms.every((p) => hasPermission(p))
  }

  /**
   * Kiểm tra vai trò của user
   * @param {string|string[]} roles - Mã vai trò, VD: 'super_admin' hoặc ['hr_manager', 'super_admin']
   */
  const hasRole = (roles) => {
    if (!roles) return true
    if (isSuperAdmin) return true
    const allowed = Array.isArray(roles) ? roles : [roles]
    return allowed.includes(userRole)
  }

  return {
    user,
    userRole,
    permissions,
    isSuperAdmin,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    hasRole,
  }
}

