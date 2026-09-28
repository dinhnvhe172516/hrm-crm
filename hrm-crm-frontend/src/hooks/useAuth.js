import { useMutation, useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/store/auth.store'
import { authService } from '@/services/hrm/auth.service'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export const useLogin = () => {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: authService.login,
    onSuccess: (res) => {
      setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
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
  const { isAuthenticated } = useAuthStore()
  return useQuery({
    queryKey: ['me'],
    queryFn: authService.getMe,
    enabled: isAuthenticated,
    select: (res) => res.data,
  })
}
