import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Building2,
  Mail,
  Lock,
  User,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  PhoneCall,
} from 'lucide-react'
import { useLogin } from '@/hooks/useAuth'
import { authService } from '@/services/hrm/auth.service'
import { useAuthStore } from '@/store/auth.store'
import toast from 'react-hot-toast'
import AnimatedWaveBackground from './AnimatedWaveBackground'

// Tài khoản mẫu nội bộ của công ty để test nhanh 1-Click
const INTERNAL_DEMO_ACCOUNTS = [
  { label: 'Admin Nhân sự', email: 'linh.nguyen@nexus-corp.com', password: 'Password@123', role: 'HR Lead' },
  { label: 'Trưởng phòng Kinh doanh', email: 'minh.tran@nexus-corp.com', password: 'Password@123', role: 'Sales Lead' },
  { label: 'Chuyên viên Bán hàng', email: 'hoa.pham@nexus-corp.com', password: 'Password@123', role: 'Sales Rep' },
]

export default function LoginPage() {
  const location = useLocation()

  // Chế độ màn hình: 'login' (Đăng nhập) | 'activate' (Kích hoạt tài khoản nhân viên mới)
  const [viewMode, setViewMode] = useState('login')

  // State đăng nhập
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPassword, setLoginPassword] = useState('')
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)

  // State kích hoạt tài khoản nhân viên mới (khi nhận được thư mời từ HR)
  const [inviteToken, setInviteToken] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [activateSuccess, setActivateSuccess] = useState(false)
  const [activatePending, setActivatePending] = useState(false)

  // State xác thực 2 bước (2FA)
  const [step2FA, setStep2FA] = useState(false)
  const [tempToken2FA, setTempToken2FA] = useState(null)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [otpPending, setOtpPending] = useState(false)

  // Errors & animations
  const [errors, setErrors] = useState({})
  const [isShaking, setIsShaking] = useState(false)

  // 3D Interactive Parallax Tilt & Light Reflection
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, mx: 0, my: 0 })

  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let currentRx = 0
    let currentRy = 0
    let targetRx = 0
    let targetRy = 0
    let targetMx = 0
    let targetMy = 0
    let animId = null

    const handlePointerMove = (e) => {
      const { innerWidth, innerHeight } = window
      const x = (e.clientX / innerWidth - 0.5) * 2
      const y = (e.clientY / innerHeight - 0.5) * 2
      targetRx = -y * 3.2 // góc nghiêng 3D tinh tế tối đa 3.2 độ
      targetRy = x * 3.2
      targetMx = x
      targetMy = y
    }

    const animate = () => {
      currentRx += (targetRx - currentRx) * 0.08
      currentRy += (targetRy - currentRy) * 0.08
      setTilt({
        rx: Number(currentRx.toFixed(2)),
        ry: Number(currentRy.toFixed(2)),
        mx: Number(targetMx.toFixed(2)),
        my: Number(targetMy.toFixed(2)),
      })
      animId = requestAnimationFrame(animate)
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })
    animId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      if (animId) cancelAnimationFrame(animId)
    }
  }, [])

  const { mutate: loginMutate, isPending: loginPending } = useLogin((data) => {
    setTempToken2FA(data.tempToken)
    setStep2FA(true)
  })

  // Điền nhanh tài khoản demo
  const handleFillDemo = (acc) => {
    setLoginEmail(acc.email)
    setLoginPassword(acc.password)
    setErrors({})
    toast.success(`Đã điền tài khoản: ${acc.label} (${acc.role})`, { icon: '✨' })
  }

  // Xử lý đăng nhập
  const handleLoginSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!loginEmail.trim()) {
      errs.loginEmail = 'Vui lòng nhập email công ty hoặc mã nhân sự'
    }
    if (!loginPassword) {
      errs.loginPassword = 'Vui lòng nhập mật khẩu tài khoản'
    }

    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 400)
      return
    }

    loginMutate(
      { email: loginEmail.trim(), password: loginPassword },
      {
        onError: (err) => {
          setIsShaking(true)
          setTimeout(() => setIsShaking(false), 400)
          setErrors({ form: err?.message || 'Tài khoản hoặc mật khẩu không chính xác' })
        },
      }
    )
  }

  // Xử lý kích hoạt tài khoản nhân viên mới
  const handleActivateSubmit = async (e) => {
    e.preventDefault()
    const errs = {}
    if (!inviteToken.trim()) errs.inviteToken = 'Vui lòng nhập mã kích hoạt nhận từ phòng Nhân sự'
    if (!newPassword) errs.newPassword = 'Vui lòng tạo mật khẩu mới'
    else if (newPassword.length < 8) errs.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự'
    if (newPassword !== confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không trùng khớp'

    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 400)
      return
    }

    setActivatePending(true)
    setTimeout(() => {
      setActivatePending(false)
      setActivateSuccess(true)
      toast.success('Kích hoạt tài khoản nhân viên thành công!')
    }, 1200)
  }

  // Xử lý xác thực 2FA OTP
  const handleVerify2FA = async (codeStr) => {
    setOtpPending(true)
    try {
      const res = await authService.verify2FA({ token: codeStr, tempToken: tempToken2FA })
      const { user, accessToken, refreshToken } = res.data
      useAuthStore.getState().setAuth(user, accessToken, refreshToken)
      toast.success('Xác thực 2 bước thành công!')
      window.location.href = '/dashboard'
    } catch (err) {
      setOtpPending(false)
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 400)
      toast.error(err?.message || 'Mã xác thực không chính xác')
    }
  }

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between items-center py-10 px-4 sm:px-6 bg-[#F8FAFC] text-slate-800 antialiased overflow-x-hidden selection:bg-blue-100 selection:text-blue-700">
      {/* ── Nền Fluid Wave Động Cao Cấp (Animated Wave Background) ─── */}
      <AnimatedWaveBackground />

      {/* ── Tiêu đề Cổng thông tin Nội bộ công ty ──────────────────── */}
      <div className="relative z-10 flex flex-col items-center mb-6 text-center">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25 ring-1 ring-white/80">
            <Building2 size={22} />
          </div>
          <span className="text-[22px] font-extrabold text-slate-900 tracking-tight">NEXUS CORP</span>
        </div>
        <p className="text-[13px] font-medium text-slate-500 flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 font-semibold shadow-2xs">
            Cổng Thông tin Nội bộ
          </span>
          <span className="w-1 h-1 rounded-full bg-blue-500" />
          <span className="text-blue-600 font-semibold">Hệ thống Quản trị HRM &amp; CRM</span>
        </p>
      </div>

      {/* ══════════════════════════════════════════════════════════════
         THẺ NỔI TRUNG TÂM (Crisp White Executive Glassmorphism Panel)
         ══════════════════════════════════════════════════════════════ */}
      <div className="relative z-10 w-full max-w-[440px] sm:max-w-[465px] anim-card-float">
        <div
          className="relative w-full rounded-2xl p-7 sm:p-9 transition-transform duration-150 overflow-hidden bg-white/95"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow:
              '0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 10px 25px -5px rgba(37, 99, 235, 0.05), 0 0 0 1px rgba(226, 232, 240, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 1)',
            transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
            transformStyle: 'preserve-3d',
          }}
        >
          {/* Đường nhấn hairline tinh tế trên đỉnh thẻ */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 pointer-events-none" />

          {/* Vệt ánh sáng bóng kính tương tác mượt theo chuột */}
          <div
            className="absolute inset-0 pointer-events-none select-none"
            style={{
              background: `radial-gradient(circle at ${50 + tilt.mx * 30}% ${50 + tilt.my * 30}%, rgba(255, 255, 255, 0.4) 0%, rgba(241, 245, 249, 0.1) 40%, transparent 70%)`,
            }}
          />
        {/* ── MÀN HÌNH XÁC THỰC 2 BƯỚC ────────────────────────────── */}
        {step2FA ? (
          <div className={`anim-page-in ${isShaking ? 'anim-shake' : ''}`}>
            <div className="text-center mb-6">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mx-auto mb-3 shadow-xs">
                <ShieldCheck size={26} />
              </div>
              <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Xác thực 2 lớp (2FA)</h2>
              <p className="text-[13px] text-slate-500 mt-1">
                Nhập mã 6 chữ số từ ứng dụng Google Authenticator của bạn.
              </p>
            </div>

            <div className="flex justify-between gap-2 mb-6">
              {otp.map((d, i) => (
                <input
                  key={i}
                  id={`otp-box-${i}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={d}
                  onChange={(e) => {
                    const val = e.target.value.slice(-1)
                    const next = [...otp]
                    next[i] = val
                    setOtp(next)
                    if (val && i < 5) {
                      document.getElementById(`otp-box-${i + 1}`)?.focus()
                    }
                    if (next.every((c) => c !== '')) {
                      handleVerify2FA(next.join(''))
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !otp[i] && i > 0) {
                      document.getElementById(`otp-box-${i - 1}`)?.focus()
                    }
                  }}
                  className="w-11 sm:w-12 h-14 rounded-xl border border-slate-200 bg-white text-center font-mono text-[22px] font-bold text-slate-900 hover:border-slate-300 focus:bg-white focus:border-blue-600 focus:ring-4 focus:ring-blue-100/70 outline-none transition-all shadow-2xs"
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleVerify2FA(otp.join(''))}
              disabled={otpPending || otp.join('').length < 6}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-md shadow-blue-500/25 disabled:opacity-50"
            >
              {otpPending ? 'Đang kiểm tra…' : 'Xác nhận & Vào hệ thống'}
            </button>

            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => setStep2FA(false)}
                className="text-[12.5px] text-slate-400 hover:text-slate-700 transition-colors"
              >
                ← Quay lại đăng nhập
              </button>
            </div>
          </div>
        ) : activateSuccess ? (
          /* ── MÀN HÌNH KÍCH HOẠT THÀNH CÔNG ──────────────────────── */
          <div className="text-center py-6 anim-page-in">
            <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <CheckCircle2 size={36} />
            </div>
            <h2 className="text-[22px] font-bold text-slate-900 tracking-tight">Kích hoạt thành công!</h2>
            <p className="text-[13.5px] text-slate-600 mt-2 leading-relaxed">
              Tài khoản nhân viên của bạn đã được thiết lập mật khẩu mới. Bạn có thể đăng nhập ngay để bắt đầu làm việc.
            </p>
            <button
              type="button"
              onClick={() => {
                setActivateSuccess(false)
                setViewMode('login')
              }}
              className="mt-6 w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all shadow-md shadow-blue-500/25"
            >
              Đăng nhập ngay →
            </button>
          </div>
        ) : (
          /* ── CHẾ ĐỘ CHÍNH: ĐĂNG NHẬP NHÂN VIÊN ──────────────────── */
          <>
            <div className="text-center mb-6">
              <h1 className="text-[22px] sm:text-[24px] font-bold text-slate-900 tracking-tight">
                {viewMode === 'login' ? 'Đăng nhập Cán bộ Nhân viên' : 'Kích hoạt Tài khoản mới'}
              </h1>
              <p className="text-[13px] text-slate-500 mt-1">
                {viewMode === 'login'
                  ? 'Sử dụng email do công ty cấp để truy cập hệ thống.'
                  : 'Nhập mã kích hoạt từ thư mời nhân sự của công ty.'}
              </p>
            </div>

            {/* Error Banner */}
            {errors.form && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[12.5px] flex items-center gap-2 anim-slide-down">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            {/* FORM ĐĂNG NHẬP */}
            {viewMode === 'login' ? (
              <div className="anim-page-in">
                {/* Nút đăng nhập nhanh SSO công ty */}
                <div className="grid grid-cols-2 gap-2.5 mb-5">
                  <button
                    type="button"
                    onClick={() => toast('Đăng nhập với Google Workspace của công ty')}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-[12.5px] font-semibold transition-all shadow-2xs"
                  >
                    <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M14.44 7.66c0-.49-.04-.95-.12-1.4H7.5v2.65h3.88a3.32 3.32 0 0 1-1.44 2.18v1.81h2.33c1.37-1.26 2.17-3.11 2.17-5.24z" fill="#4285F4"/>
                      <path d="M7.5 14.5c1.95 0 3.59-.64 4.78-1.74l-2.33-1.81c-.65.44-1.47.7-2.45.7-1.88 0-3.47-1.27-4.04-2.97H1.07v1.88A7.5 7.5 0 0 0 7.5 14.5z" fill="#34A853"/>
                      <path d="M3.46 8.68A4.5 4.5 0 0 1 3.22 7c0-.58.1-1.15.24-1.68V3.44H1.07A7.5 7.5 0 0 0 .5 7c0 1.14.26 2.22.57 3.12l2.4-1.44z" fill="#FBBC05"/>
                      <path d="M7.5 2.35c1.06 0 2.01.36 2.76 1.07l2.07-2.07C11.08 1.17 9.44.5 7.5.5A7.5 7.5 0 0 0 1.07 3.44L3.46 5.32C4.03 3.62 5.62 2.35 7.5 2.35z" fill="#EA4335"/>
                    </svg>
                    <span>Google Mail</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => toast('Đăng nhập với Microsoft 365 công ty')}
                    className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 hover:border-slate-300 text-slate-700 text-[12.5px] font-semibold transition-all shadow-2xs"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14">
                      <rect x=".5" y=".5" width="6" height="6" fill="#F25022"/>
                      <rect x="7.5" y=".5" width="6" height="6" fill="#7FBA00"/>
                      <rect x=".5" y="7.5" width="6" height="6" fill="#00A4EF"/>
                      <rect x="7.5" y="7.5" width="6" height="6" fill="#FFB900"/>
                    </svg>
                    <span>Microsoft 365</span>
                  </button>
                </div>

                <div className="relative flex items-center justify-center mb-5">
                  <div className="border-t border-slate-200 w-full" />
                  <span className="bg-white px-2.5 text-[11px] uppercase tracking-wider text-slate-400 font-semibold absolute rounded-full border border-slate-100 shadow-2xs">
                    hoặc đăng nhập bằng mật khẩu
                  </span>
                </div>

                <form onSubmit={handleLoginSubmit} noValidate className={`space-y-3.5 ${isShaking ? 'anim-shake' : ''}`}>
                  <div>
                    <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                      Email nội bộ / Mã nhân viên <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Mail size={17} />
                      </span>
                      <input
                        type="text"
                        value={loginEmail}
                        onChange={(e) => {
                          setLoginEmail(e.target.value)
                          setErrors((p) => ({ ...p, loginEmail: '', form: '' }))
                        }}
                        placeholder="ten.nhanvien@nexus-corp.com hoặc NV001"
                        autoComplete="username"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-[13.5px] outline-none transition-all ${
                          errors.loginEmail
                            ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                            : 'border-slate-200 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 shadow-2xs text-slate-900 font-medium placeholder:text-slate-400'
                        }`}
                      />
                    </div>
                    {errors.loginEmail && (
                      <p className="text-[11.5px] text-red-500 mt-1 pl-1">{errors.loginEmail}</p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[12.5px] font-semibold text-slate-700">
                        Mật khẩu tài khoản <span className="text-red-500">*</span>
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-[12px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                        <Lock size={17} />
                      </span>
                      <input
                        type={showLoginPassword ? 'text' : 'password'}
                        value={loginPassword}
                        onChange={(e) => {
                          setLoginPassword(e.target.value)
                          setErrors((p) => ({ ...p, loginPassword: '', form: '' }))
                        }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-[13.5px] outline-none transition-all ${
                          errors.loginPassword
                            ? 'border-red-400 bg-red-50/50 focus:border-red-500'
                            : 'border-slate-200 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 shadow-2xs text-slate-900 font-medium placeholder:text-slate-400'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword((p) => !p)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                      >
                        {showLoginPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {errors.loginPassword && (
                      <p className="text-[11.5px] text-red-500 mt-1 pl-1">{errors.loginPassword}</p>
                    )}
                  </div>

                  <div className="flex items-center pt-0.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500 cursor-pointer"
                      />
                      <span className="text-[12.5px] text-slate-600">Ghi nhớ đăng nhập trên máy tính này</span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loginPending}
                    className="w-full mt-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
                  >
                    {loginPending ? (
                      <>
                        <svg className="anim-spin" width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" strokeDasharray="40" strokeDashoffset="15" strokeLinecap="round" />
                        </svg>
                        <span>Đang xác thực…</span>
                      </>
                    ) : (
                      <>
                        <span>Đăng nhập vào hệ thống</span>
                        <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>

                {/* Hộp tài khoản demo nội bộ */}
                <div className="mt-5 p-3 rounded-xl bg-slate-50/90 border border-slate-200/80 shadow-2xs">
                  <div className="text-[10.5px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1">
                    <Sparkles size={12} className="text-amber-500" />
                    Tài khoản nhân sự mẫu (1-Click Test)
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {INTERNAL_DEMO_ACCOUNTS.map((acc) => (
                      <button
                        key={acc.label}
                        type="button"
                        onClick={() => handleFillDemo(acc)}
                        className="px-2.5 py-1 rounded-lg text-[11.5px] font-medium bg-white hover:bg-slate-50 border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 transition-all shadow-2xs"
                      >
                        <span className="font-bold text-blue-600 text-[10px]">[{acc.role}]</span> {acc.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chuyển sang kích hoạt tài khoản nhân viên mới */}
                <div className="mt-4 pt-3 border-t border-slate-200/70 text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({})
                      setViewMode('activate')
                    }}
                    className="text-[12.5px] font-medium text-slate-500 hover:text-blue-600 transition-colors"
                  >
                    Nhân viên mới nhận thư mời? <span className="text-blue-600 underline font-semibold">Kích hoạt tài khoản tại đây</span>
                  </button>
                </div>
              </div>
            ) : (
              /* FORM KÍCH HOẠT NHÂN VIÊN MỚI */
              <form onSubmit={handleActivateSubmit} noValidate className={`space-y-3.5 anim-page-in ${isShaking ? 'anim-shake' : ''}`}>
                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                    Mã kích hoạt / Token từ HR <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <KeyRound size={17} />
                    </span>
                    <input
                      type="text"
                      value={inviteToken}
                      onChange={(e) => {
                        setInviteToken(e.target.value)
                        setErrors((p) => ({ ...p, inviteToken: '' }))
                      }}
                      placeholder="Mã trong email thư mời (vd: EMP-INV-2026)"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-[13.5px] outline-none transition-all font-mono text-slate-900 placeholder:text-slate-400 shadow-2xs"
                    />
                  </div>
                  {errors.inviteToken && <p className="text-[11.5px] text-red-500 mt-1 pl-1">{errors.inviteToken}</p>}
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                    Mật khẩu cá nhân mới <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={17} />
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value)
                        setErrors((p) => ({ ...p, newPassword: '' }))
                      }}
                      placeholder="Tối thiểu 8 ký tự"
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-[13.5px] outline-none transition-all text-slate-900 placeholder:text-slate-400 shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.newPassword && <p className="text-[11.5px] text-red-500 mt-1 pl-1">{errors.newPassword}</p>}
                </div>

                <div>
                  <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                    Xác nhận lại mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <Lock size={17} />
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value)
                        setErrors((p) => ({ ...p, confirmPassword: '' }))
                      }}
                      placeholder="Nhập lại mật khẩu mới"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:border-slate-300 focus:border-blue-600 focus:ring-4 focus:ring-blue-50 text-[13.5px] outline-none transition-all text-slate-900 placeholder:text-slate-400 shadow-2xs"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-[11.5px] text-red-500 mt-1 pl-1">{errors.confirmPassword}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={activatePending}
                  className="w-full mt-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
                >
                  {activatePending ? 'Đang kích hoạt…' : 'Kích hoạt tài khoản ngay'}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setErrors({})
                      setViewMode('login')
                    }}
                    className="text-[12.5px] text-slate-400 hover:text-slate-700 transition-colors"
                  >
                    ← Quay lại màn hình đăng nhập
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* ── Box trợ giúp nội bộ IT & HR Helpdesk ───────────────────── */}
        <div className="mt-5 p-3 rounded-xl bg-blue-50/70 border border-blue-100/90 flex items-start gap-2.5 text-[12px] text-slate-600 leading-relaxed shadow-2xs">
          <HelpCircle size={16} className="text-blue-600 shrink-0 mt-0.5" />
          <span>
            Chưa có tài khoản hoặc cần trợ giúp? Liên hệ <strong>Phòng Nhân sự (Ext: 102)</strong> hoặc gửi yêu cầu tới <strong>it-helpdesk@nexus.com</strong>.
          </span>
        </div>
        </div>
      </div>

      {/* ── Footer hệ thống nội bộ ─────────────────────────────────── */}
      <footer className="relative z-10 mt-8 text-center text-[12px] text-slate-500 font-medium">
        <p className="mb-1 text-slate-600">© 2026 NEXUS Corporation. Hệ thống Quản trị Nội bộ.</p>
        <p className="text-[11px] text-slate-400">
          Chỉ dành cho cán bộ nhân viên công ty · Mọi hành vi truy cập trái phép đều được ghi nhật ký giám sát.
        </p>
      </footer>
    </div>
  )
}
