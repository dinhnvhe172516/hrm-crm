import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/hrm/auth.service'
import { Building2, Mail, CheckCircle2, ArrowRight, AlertCircle, HelpCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import AnimatedWaveBackground from '@/components/common/AnimatedWaveBackground'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sentEmail, setSentEmail] = useState(null)
  const [error, setError] = useState('')
  const [isShaking, setIsShaking] = useState(false)

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => authService.forgotPassword(data),
    onSuccess: (_, vars) => {
      setSentEmail(vars.email)
      toast.success('Đã gửi email khôi phục mật khẩu!')
    },
    onError: (err) => {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 400)
      const msg = err?.message || 'Không tìm thấy tài khoản email nội bộ này.'
      setError(msg)
      toast.error(msg)
    },
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!email.trim()) {
      setError('Vui lòng nhập email nội bộ của bạn')
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 400)
      return
    }
    setError('')
    mutate({ email: email.trim() })
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
        {!sentEmail ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Khôi phục mật khẩu</h1>
              <p className="text-[13px] text-slate-500 mt-1 leading-relaxed">
                Nhập email nội bộ công ty để nhận liên kết đặt lại mật khẩu mới.
              </p>
            </div>

            <form onSubmit={handleSubmit} noValidate className={`space-y-4 ${isShaking ? 'anim-shake' : ''}`}>
              <div>
                <label className="block text-[12.5px] font-semibold text-slate-700 mb-1">
                  Email công ty đã được cấp <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <Mail size={17} />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value)
                      setError('')
                    }}
                    placeholder="ten.nhanvien@nexus-corp.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-[13.5px] outline-none transition-all"
                  />
                </div>
                {error && <p className="text-[11.5px] text-red-500 mt-1 pl-1">{error}</p>}
              </div>

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {isPending ? 'Đang gửi mã…' : 'Gửi liên kết khôi phục'}
              </button>
            </form>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Kiểm tra hộp thư email</h2>
            <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
              Chúng tôi đã gửi mã xác thực OTP (6 chữ số) và liên kết khôi phục tới <strong className="text-slate-900 font-mono">{sentEmail}</strong>.
            </p>
            <div className="mt-5">
              <Link
                to={`/reset-password?email=${encodeURIComponent(sentEmail)}`}
                className="w-full inline-flex items-center justify-center gap-2 py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[13.5px] font-semibold transition-all shadow-md shadow-blue-500/20"
              >
                <span>Nhập mã OTP & Đổi mật khẩu ngay</span>
                <ArrowRight size={16} />
              </Link>
            </div>
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
