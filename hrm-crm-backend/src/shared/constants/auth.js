'use strict';

/**
 * Constants liên quan đến authentication & authorization.
 * Đặt trong shared/constants để các module khác (audit, security...) có thể dùng lại.
 */
const AUTH_CONSTANTS = {
  // ─── Brute-force protection ─────────────────────────────────────────────────
  MAX_FAILED_ATTEMPTS: 5,
  LOCK_DURATION_MS:    30 * 60 * 1000, // 30 phút

  // ─── Password policy ─────────────────────────────────────────────────────────
  PASSWORD_MIN_LENGTH:    8,
  PASSWORD_HISTORY_LIMIT: 5, // Không cho dùng lại 5 MK gần nhất

  // ─── Session ─────────────────────────────────────────────────────────────────
  DEFAULT_MAX_SESSIONS_PER_USER: 5,
  DEFAULT_SESSION_LIFETIME_DAYS: 7,

  // ─── Refresh token ───────────────────────────────────────────────────────────
  DEFAULT_REFRESH_EXPIRES_DAYS: 7,

  // ─── Lý do đăng nhập thất bại (khớp LoginHistory.model enum) ────────────────
  FAILURE_REASON: {
    WRONG_PASSWORD:   'wrong_password',
    ACCOUNT_LOCKED:   'account_locked',
    NOT_FOUND:        'not_found',
    TWO_FA_FAILED:    '2fa_failed',
    ACCOUNT_INACTIVE: 'account_inactive',
  },

  // ─── Lý do thu hồi refresh token (khớp RefreshToken.model enum) ─────────────
  REVOKE_REASON: {
    USED:            'used',
    LOGOUT:          'logout',
    LOGOUT_ALL:      'logout_all',
    SECURITY_BREACH: 'security_breach',
    EXPIRED:         'expired',
  },

  // ─── Lý do buộc đổi mật khẩu (khớp UserCredential.model enum) ───────────────
  MUST_CHANGE_REASON: {
    FIRST_LOGIN: 'first_login',
    ADMIN_RESET: 'admin_reset',
    POLICY:      'policy',
    SECURITY:    'security',
  },
};

module.exports = AUTH_CONSTANTS;
