import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/hrm/auth.service'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

/**
 * useLogin — hỗ trợ 2FA flow:
 *   - Nếu server trả về requiresTwoFactor: true → gọi onRequires2FA(tempToken)
 *   - Nếu login thành công → setAuth + navigate dashboard
 */
export const useLogin = (onRequires2FA) => {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (res) => {
      const { requiresTwoFactor, tempToken, user, accessToken, refreshToken } = res.data
      if (requiresTwoFactor && onRequires2FA) {
        onRequires2FA({ tempToken })
        return
      }
      setAuth(user, accessToken, refreshToken)
      toast.success('Đăng nhập thành công!')
      navigate('/dashboard')
    },
    onError: (err) => toast.error(err.message || 'Đăng nhập thất bại'),
  })
}

export const useLogout = () => {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authService.logout,
    onSettled: () => {
      logout()
      navigate('/login')
    },
  })
}

export const useMe = () => {
  const { isAuthenticated, updateUser } = useAuthStore()
  return useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const res = await authService.getMe()
      if (res?.data) {
        updateUser(res.data)
      }
      return res.data
    },
    enabled: isAuthenticated,
  })
}
