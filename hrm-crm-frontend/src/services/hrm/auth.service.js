import api from '../api'

export const authService = {
  login:          (data)  => api.post('/auth/login', data),
  logout:         ()      => api.post('/auth/logout'),
  logoutAll:      ()      => api.post('/auth/logout-all'),
  getMe:          ()      => api.get('/auth/me'),
  refreshToken:   (token) => api.post('/auth/refresh-token', { refreshToken: token }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword:  (data)  => api.post('/auth/reset-password', data),
  verifyEmail:    (token) => api.post('/auth/verify-email', { token }),
  changePassword: (data)  => api.post('/auth/change-password', data),
  getSessions:    ()      => api.get('/auth/sessions'),
  revokeSession:  (id)    => api.delete(`/auth/sessions/${id}`),
  enable2FA:      ()      => api.post('/auth/2fa/enable'),
  verify2FA:      (token) => api.post('/auth/2fa/verify', { token }),
  disable2FA:     (token) => api.post('/auth/2fa/disable', { token }),
}
