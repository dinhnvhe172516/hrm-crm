import api from '../api'

export const authService = {
  // ── Core auth ─────────────────────────────────────────────
  login:          (data)  => api.post('/auth/login', data),
  register:       (data)  => api.post('/auth/register', data),
  loginGoogle:    (token) => api.post('/auth/google', { token }),
  logout:         ()      => api.post('/auth/logout'),
  logoutAll:      ()      => api.post('/auth/logout-all'),
  getMe:          ()      => api.get('/auth/me'),
  refreshToken:   (token) => api.post('/auth/refresh-token', { refreshToken: token }),

  // ── Password ───────────────────────────────────────────────
  forgotPassword: (data)  => api.post('/auth/forgot-password', data),
  resetPassword:  (data)  => api.post('/auth/reset-password', data),
  changePassword: (data)  => api.post('/auth/change-password', data),

  // ── Email verification ─────────────────────────────────────
  verifyEmail:       (token) => api.post('/auth/verify-email', { token }),
  verifyEmailOtp:    (data)  => api.post('/auth/verify-email/otp', data),
  resendVerifyEmail: (email) => api.post('/auth/verify-email/resend', { email }),

  // ── 2FA ───────────────────────────────────────────────────
  setup2FA:       ()        => api.post('/auth/2fa/setup'),       // trả về QR + secret
  confirm2FA:     (data)    => api.post('/auth/2fa/confirm', data), // xác nhận kích hoạt
  verify2FA:      (data)    => api.post('/auth/2fa/verify', data), // dùng khi đăng nhập
  disable2FA:     (data)    => api.post('/auth/2fa/disable', data),
  getBackupCodes: ()        => api.get('/auth/2fa/backup-codes'),
  regenBackupCodes: (data)  => api.post('/auth/2fa/backup-codes/regenerate', data),
  verifyBackupCode: (data)  => api.post('/auth/2fa/backup-code', data),

  // ── Sessions ──────────────────────────────────────────────
  getSessions:    ()      => api.get('/auth/sessions'),
  revokeSession:  (id)    => api.delete(`/auth/sessions/${id}`),

  // ── Login history ─────────────────────────────────────────
  getLoginHistory: (params) => api.get('/auth/login-history', { params }),
}
