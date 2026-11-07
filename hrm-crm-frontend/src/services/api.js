import axios from 'axios'
import { useAuthStore } from '@/store/auth.store'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
})

// Request interceptor — attach access token
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Response interceptor — auto refresh token on 401
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response.data,
  async (error) => {
    const originalRequest = error.config

    const isAuthRoute =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register') ||
      originalRequest.url?.includes('/auth/refresh-token') ||
      originalRequest.url?.includes('/auth/forgot-password') ||
      originalRequest.url?.includes('/auth/reset-password') ||
      originalRequest.url?.includes('/auth/2fa/verify') ||
      originalRequest.url?.includes('/auth/verify-email')

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthRoute) {
      const { refreshToken, setTokens, logout } = useAuthStore.getState()

      if (!refreshToken) {
        logout()
        return Promise.reject(error.response?.data || error)
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`
          return api(originalRequest)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, { refreshToken })
        const { accessToken, refreshToken: newRefreshToken } = res.data.data
        setTokens(accessToken, newRefreshToken)
        processQueue(null, accessToken)
        originalRequest.headers.Authorization = `Bearer ${accessToken}`
        return api(originalRequest)
      } catch (err) {
        processQueue(err, null)
        logout()
        window.location.href = '/login'
        return Promise.reject(err)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error.response?.data || error)
  }
)

export default api
