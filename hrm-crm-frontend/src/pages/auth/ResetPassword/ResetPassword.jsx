import React, { useState } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/hrm/auth.service'
import { Building2, Lock, Eye, EyeOff, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import AnimatedWaveBackground from '@/components/common/AnimatedWaveBackground'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [done, setDone] = useState(false)
  const [isShaking, setIsShaking] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => authService.resetPassword(data),
    onSuccess: () => {
      setDone(true)
      toast.success('Mật khẩu mới đã được cập nhật thành công!')
      setTimeout(() => navigate('/login'), 2000)
    },
    onError: (err) => {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 400)
      const msg = err?.message || 'Không thể đặt lại mật khẩu hoặc liên kết đã hết hạn.'
      setErrors({ form: msg })
      toast.error(msg)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    const errs = {}
    if (!token) errs.form = 'Mã token khôi phục không hợp lệ hoặc đã hết hạn.'
    if (!password) errs.password = 'Vui lòng nhập mật khẩu mới.'
    else if (password.length < 8) errs.password = 'Mật khẩu phải chứa ít nhất 8 ký tự.'
    if (password !== confirmPassword) errs.confirmPassword = 'Mật khẩu xác nhận không khớp.'

    setErrors(errs)
    if (Object.keys(errs).length > 0) {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 400)
      return
    }

    mutate({ token, newPassword: password })
  }

  return (
    <div className="relative min-h-screen flex flex-col justify-between items-center py-10 px-4 bg-[#F8FAFC] text-slate-800 antialiased overflow-x-hidden selection:bg-blue-100 selection:text-blue-700">
      <AnimatedWaveBackground />

      <div className="relative z-10 flex flex-col items-center mb-6 text-center">
        <div className="flex items-center gap-2.5 mb-2">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/25">
            <Building2 size={22} />
          </div>
          <span className="text-[22px] font-extrabold text-slate-900 tracking-tight">NEXUS CORP</span>
        </div>
        <p className="text-[13px] font-medium text-slate-500">Cổng Thông tin Nội bộ · Quản trị HRM &amp; CRM</p>
      </div>

      <div className="relative z-10 w-full max-w-[440px] anim-card-float">
        <div
          className="relative w-full rounded-2xl p-7 sm:p-9 transition-all overflow-hidden bg-white/95"
          style={{
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(226, 232, 240, 0.9)',
            boxShadow:
              '0 25px 50px -12px rgba(15, 23, 42, 0.12), 0 10px 25px -5px rgba(37, 99, 235, 0.05), 0 0 0 1px rgba(226, 232, 240, 0.8), inset 0 1px 0 0 rgba(255, 255, 255, 1)',
          }}
        >
          {/* Đường nhấn hairline tinh tế */}
          <div className="absolute top-0 left-0 right-0 h-[2.5px] bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 pointer-events-none" />
        {!done ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Đặt lại mật khẩu</h1>
              <p className="text-[13px] text-slate-500 mt-1">
                Thiết lập mật khẩu an toàn mới cho tài khoản nội bộ của bạn.
              </p>
            </div>

            {errors.form && (
              <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-[12.5px] flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errors.form}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className={`space-y-3.5 ${isShaking ? 'anim-shake' : ''}`}>
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Mật khẩu mới (tối thiểu 8 ký tự) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Lock size={17} />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value)
                      setErrors((p) => ({ ...p, password: '', form: '' }))
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-[13.5px] outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-[11.5px] text-red-500 mt-1 pl-1">{errors.password}</p>}
              </div>

              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Xác nhận lại mật khẩu mới <span className="text-red-500">*</span>
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
                      setErrors((p) => ({ ...p, confirmPassword: '', form: '' }))
                    }}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-[13.5px] outline-none transition-all"
                  />
                </div>
                {errors.confirmPassword && <p className="text-[11.5px] text-red-500 mt-1 pl-1">{errors.confirmPassword}</p>}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {isPending ? 'Đang cập nhật…' : 'Cập nhật mật khẩu & Đăng nhập'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Cập nhật thành công!</h2>
            <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
              Mật khẩu mới đã được cập nhật. Đang tự động chuyển hướng tới trang đăng nhập…
            </p>
          </div>
        )}

        <div className="mt-6 pt-4 border-t border-slate-100 text-center">
          <Link to="/login" className="text-[12.5px] text-blue-600 hover:underline font-medium">
            ← Quay lại trang đăng nhập
          </Link>
        </div>
      </div>
    </div>

      <footer className="relative z-10 mt-8 text-center text-[12px] text-slate-400">
        © 2026 NEXUS Corporation. Hệ thống Quản trị Nội bộ.
      </footer>
    </div>
  )
}
