import React, { useState, useRef, useEffect } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { authService } from '@/services/hrm/auth.service'
import { useAuthStore } from '@/store/auth.store'
import { Building2, CheckCircle2, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import AnimatedWaveBackground from '@/components/common/AnimatedWaveBackground'

const RESEND_COOLDOWN = 60

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams()
  const email = searchParams.get('email') || ''
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [isShaking, setIsShaking] = useState(false)
  const [verified, setVerified] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const inputRefs = [useRef(null), useRef(null), useRef(null), useRef(null), useRef(null), useRef(null)]

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const { mutate: verifyOtp, isPending: isVerifying } = useMutation({
    mutationFn: (data) => authService.verifyEmailOtp(data),
    onSuccess: (res) => {
      setVerified(true)
      toast.success('Xác minh email thành công!')
      if (res.data?.accessToken) {
        setAuth(res.data.user, res.data.accessToken, res.data.refreshToken)
        setTimeout(() => navigate('/dashboard'), 2000)
      } else {
        setTimeout(() => navigate('/login'), 2000)
      }
    },
    onError: (err) => {
      setIsShaking(true)
      setTimeout(() => setIsShaking(false), 400)
      toast.error(err?.message || 'Mã xác minh không đúng hoặc đã hết hạn.')
    },
  })

  const { mutate: resend, isPending: isResending } = useMutation({
    mutationFn: () => authService.resendVerifyEmail(email),
    onSuccess: () => {
      toast.success('Đã gửi lại mã OTP tới hộp thư của bạn!')
      setCooldown(RESEND_COOLDOWN)
    },
    onError: (err) => toast.error(err?.message || 'Gửi lại mã không thành công.'),
  })

  const handleChange = (val, idx) => {
    const digit = val.replace(/\D/g, '').slice(-1)
    const next = [...otp]
    next[idx] = digit
    setOtp(next)

    if (digit && idx < 5) {
      inputRefs[idx + 1].current?.focus()
    }

    if (next.every((d) => d !== '')) {
      verifyOtp({ email, otp: next.join('') })
    }
  }

  const handleKeyDown = (idx, e) => {
    if (e.key === 'Backspace' && !otp[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus()
    }
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
        {!verified ? (
          <>
            <div className="mb-6 text-center">
              <h1 className="text-[22px] font-bold text-slate-900 tracking-tight">Xác minh Email Nội bộ</h1>
              <p className="text-[13px] text-slate-500 mt-1">
                Nhập mã xác thực 6 số đã được gửi tới <span className="text-slate-900 font-semibold">{email || 'email của bạn'}</span>.
              </p>
            </div>

            <div className={`space-y-5 ${isShaking ? 'anim-shake' : ''}`}>
              <div className="flex justify-between gap-2">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={inputRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(e.target.value, i)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    disabled={isVerifying}
                    className="w-11 sm:w-12 h-14 rounded-xl border border-slate-300 bg-white text-center font-mono text-[22px] font-bold text-slate-900 focus:border-blue-600 focus:ring-3 focus:ring-blue-100 outline-none transition-all shadow-xs disabled:opacity-50"
                  />
                ))}
              </div>

              <button
                type="button"
                onClick={() => verifyOtp({ email, otp: otp.join('') })}
                disabled={isVerifying || otp.join('').length < 6}
                className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[14px] font-semibold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50"
              >
                {isVerifying ? 'Đang kiểm tra…' : 'Xác minh Email'}
              </button>

              <div className="text-center pt-1">
                {cooldown > 0 ? (
                  <span className="text-[12.5px] text-slate-500">
                    Gửi lại mã sau <strong className="text-slate-800 font-mono">{cooldown}s</strong>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => resend()}
                    disabled={isResending}
                    className="text-[12.5px] text-blue-600 hover:text-blue-700 font-semibold underline underline-offset-4"
                  >
                    Chưa nhận được mã? Gửi lại ngay
                  </button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-sm">
              <CheckCircle2 size={32} />
            </div>
            <h2 className="text-[20px] font-bold text-slate-900 tracking-tight">Xác thực thành công!</h2>
            <p className="text-[13px] text-slate-600 mt-2 leading-relaxed">
              Tài khoản nhân viên của bạn đã sẵn sàng. Đang tự động chuyển hướng vào không gian làm việc…
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
