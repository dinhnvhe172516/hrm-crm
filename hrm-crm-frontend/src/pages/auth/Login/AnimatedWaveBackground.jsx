import React, { useEffect, useRef } from 'react'

/**
 * AnimatedWaveBackground
 * ─────────────────────────────────────────────────────────────────────────────
 * Premium 3D Immersive Fluid Waves for NEXUS CORP Enterprise Portal.
 * - Multi-layer volumetric flowing liquid ribbons (Royal Blue & Ocean Azure).
 * - Precision luminous crest rim catchlights.
 * - Subtle 3D mouse parallax tracking.
 * - Clean neutral-to-soft-ice canvas that preserves optical contrast for the central card.
 * - Hardware accelerated HTML5 canvas with Retina devicePixelRatio scaling.
 * - Full support for prefers-reduced-motion.
 */
export default function AnimatedWaveBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId = null
    let width = 0
    let height = 0
    let dpr = 1

    // Smoothed mouse position via lerp
    const mouse = {
      targetX: 0,
      targetY: 0,
      currentX: 0,
      currentY: 0,
      px: 0,
      py: 0,
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const handleResize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.floor(width * dpr)
      canvas.height = Math.floor(height * dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      ctx.scale(dpr, dpr)

      if (prefersReducedMotion) {
        drawFrame(10)
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)

    const handlePointerMove = (e) => {
      const nx = (e.clientX / window.innerWidth - 0.5) * 2
      const ny = (e.clientY / window.innerHeight - 0.5) * 2
      mouse.targetX = nx
      mouse.targetY = ny
    }

    window.addEventListener('pointermove', handlePointerMove, { passive: true })

    // Subtle micro-particles that drift like ambient starlight
    const particles = Array.from({ length: 16 }).map(() => ({
      x: Math.random() * (width || 1200),
      y: Math.random() * (height || 800),
      r: Math.random() * 1.5 + 0.8,
      speedX: (Math.random() - 0.5) * 0.25,
      speedY: -Math.random() * 0.3 - 0.08,
      opacity: Math.random() * 0.45 + 0.2,
    }))

    const startTime = performance.now()

    const drawFrame = (elapsedSeconds) => {
      // Lerp mouse coordinates
      mouse.currentX += (mouse.targetX - mouse.currentX) * 0.04
      mouse.currentY += (mouse.targetY - mouse.currentY) * 0.04
      mouse.px = mouse.currentX
      mouse.py = mouse.currentY

      ctx.clearRect(0, 0, width, height)
      const t = elapsedSeconds

      // ── 1. Nền Canvas Sạch Sẽ, Sáng Sủa & Tinh Tế ───────────────────
      const bgGrad = ctx.createLinearGradient(0, 0, 0, height)
      bgGrad.addColorStop(0, '#FAFCFF')
      bgGrad.addColorStop(0.45, '#F1F5F9')
      bgGrad.addColorStop(0.85, '#E2E8F0')
      bgGrad.addColorStop(1, '#DBEAFE')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, width, height)

      // ── 2. Đốm Sáng Thể Tích Theo Chuột (Volumetric Ambient Glow) ──
      const lightX = width * 0.5 + mouse.px * (width * 0.2)
      const lightY = height * 0.35 + mouse.py * (height * 0.15)
      const spotGrad = ctx.createRadialGradient(lightX, lightY, 30, lightX, lightY, width * 0.6)
      spotGrad.addColorStop(0, 'rgba(255, 255, 255, 0.75)')
      spotGrad.addColorStop(0.4, 'rgba(241, 245, 249, 0.35)')
      spotGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = spotGrad
      ctx.fillRect(0, 0, width, height)

      // Vệt sáng xanh mềm mại ở góc dưới (Bottom Ambient Reflection)
      const bottomGlow = ctx.createRadialGradient(
        width * 0.75 + mouse.px * 40,
        height * 0.85,
        40,
        width * 0.75,
        height * 0.85,
        width * 0.55
      )
      bottomGlow.addColorStop(0, 'rgba(37, 99, 235, 0.14)')
      bottomGlow.addColorStop(0.6, 'rgba(56, 189, 248, 0.05)')
      bottomGlow.addColorStop(1, 'transparent')
      ctx.fillStyle = bottomGlow
      ctx.fillRect(0, 0, width, height)

      // ── 3. HÀM TẠO SÓNG CHUYỂN ĐỘNG HỮU CƠ ─────────────────────────
      const renderVolumetricWave = ({
        baseYRatio,
        amplitude,
        speed,
        freq1,
        freq2,
        freq3,
        parallaxFactor,
        gradStops,
        rimColor,
        rimWidth,
      }) => {
        const baseY = height * baseYRatio + mouse.py * parallaxFactor * 35
        const pShiftX = mouse.px * parallaxFactor * 50

        ctx.beginPath()
        ctx.moveTo(0, height)
        ctx.lineTo(0, baseY)

        const step = 8
        const points = []

        for (let x = 0; x <= width + step; x += step) {
          const s1 = Math.sin(x * freq1 + t * speed + pShiftX * 0.01) * amplitude
          const s2 = Math.cos(x * freq2 - t * (speed * 0.75)) * (amplitude * 0.42)
          const s3 = Math.sin((x + 180) * freq3 + t * (speed * 0.35)) * (amplitude * 0.22)
          const y = baseY + s1 + s2 + s3
          ctx.lineTo(x, y)
          points.push({ x, y })
        }

        ctx.lineTo(width, height)
        ctx.closePath()

        // Tô khối thể tích
        const waveGrad = ctx.createLinearGradient(0, baseY - amplitude, 0, height)
        gradStops.forEach((stop) => {
          waveGrad.addColorStop(stop.offset, stop.color)
        })
        ctx.fillStyle = waveGrad
        ctx.fill()

        // Viền sáng Crest Line phản chiếu cao cấp
        if (rimColor) {
          ctx.save()
          ctx.beginPath()
          points.forEach((pt, idx) => {
            if (idx === 0) ctx.moveTo(pt.x, pt.y)
            else ctx.lineTo(pt.x, pt.y)
          })
          ctx.strokeStyle = rimColor
          ctx.lineWidth = rimWidth || 1.5
          ctx.shadowColor = rimColor
          ctx.shadowBlur = 6
          ctx.stroke()
          ctx.restore()
        }
      }

      // ── LAYER 0: Sóng Khí Quyển Phía Trên (Ambient Atmospheric Ribbon)
      renderVolumetricWave({
        baseYRatio: 0.38,
        amplitude: 45,
        speed: 0.18,
        freq1: 0.0012,
        freq2: 0.0024,
        freq3: 0.0006,
        parallaxFactor: 0.25,
        gradStops: [
          { offset: 0, color: 'rgba(224, 242, 254, 0.45)' },
          { offset: 0.5, color: 'rgba(219, 234, 254, 0.25)' },
          { offset: 1, color: 'rgba(241, 245, 249, 0.05)' },
        ],
        rimColor: 'rgba(255, 255, 255, 0.65)',
        rimWidth: 1.5,
      })

      // ── LAYER 1: Sóng Trung Gian Ngược Pha (Azure Flowing Ribbon) ────
      renderVolumetricWave({
        baseYRatio: 0.56,
        amplitude: 58,
        speed: -0.22, // Ngược pha tạo chuyển động cuộn mềm mại
        freq1: 0.0016,
        freq2: 0.0032,
        freq3: 0.0008,
        parallaxFactor: 0.5,
        gradStops: [
          { offset: 0, color: 'rgba(147, 197, 253, 0.38)' },
          { offset: 0.45, color: 'rgba(96, 165, 250, 0.22)' },
          { offset: 1, color: 'rgba(59, 130, 246, 0.06)' },
        ],
        rimColor: 'rgba(96, 165, 250, 0.55)',
        rimWidth: 1.8,
      })

      // ── LAYER 2: Khối Nước Thể Tích Chính (Royal Blue Liquid Core) ──
      renderVolumetricWave({
        baseYRatio: 0.72,
        amplitude: 75,
        speed: 0.32,
        freq1: 0.0019,
        freq2: 0.0038,
        freq3: 0.001,
        parallaxFactor: 0.8,
        gradStops: [
          { offset: 0, color: 'rgba(59, 130, 246, 0.32)' },
          { offset: 0.4, color: 'rgba(37, 99, 235, 0.22)' },
          { offset: 1, color: 'rgba(29, 78, 216, 0.08)' },
        ],
        rimColor: 'rgba(255, 255, 255, 0.85)',
        rimWidth: 2,
      })

      // ── LAYER 3: Dải Sóng Pha Lê Phía Trước (Foreground Ocean Wave) ──
      renderVolumetricWave({
        baseYRatio: 0.86,
        amplitude: 50,
        speed: 0.45,
        freq1: 0.0024,
        freq2: 0.0048,
        freq3: 0.0012,
        parallaxFactor: 1.15,
        gradStops: [
          { offset: 0, color: 'rgba(14, 165, 233, 0.30)' },
          { offset: 0.5, color: 'rgba(2, 132, 199, 0.18)' },
          { offset: 1, color: 'rgba(30, 58, 138, 0.05)' },
        ],
        rimColor: 'rgba(255, 255, 255, 0.95)',
        rimWidth: 2,
      })

      // ── 4. Đường Kẻ Vector Công Nghệ Mảnh (Enterprise Tech Lines) ────
      ctx.save()
      const drawTechLine = (baseYOffset, speedMult, color) => {
        const baseY = height * baseYOffset + mouse.py * 20
        ctx.beginPath()
        for (let x = 0; x <= width; x += 10) {
          const y =
            baseY +
            Math.sin(x * 0.0018 + t * 0.25 * speedMult) * 35 +
            Math.cos(x * 0.0032 - t * 0.15) * 18
          if (x === 0) ctx.moveTo(x, y)
          else ctx.lineTo(x, y)
        }
        ctx.strokeStyle = color
        ctx.lineWidth = 1
        ctx.stroke()
      }
      drawTechLine(0.48, 1, 'rgba(59, 130, 246, 0.20)')
      drawTechLine(0.65, -0.8, 'rgba(14, 165, 233, 0.22)')
      ctx.restore()

      // ── 5. Hạt Ánh Sáng Tinh Tế (Ambient Micro Dust) ────────────────
      ctx.save()
      particles.forEach((p) => {
        p.x += p.speedX
        p.y += p.speedY
        if (p.y < 0) {
          p.y = height + 10
          p.x = Math.random() * width
        }
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0

        ctx.beginPath()
        ctx.arc(p.x + mouse.px * 15, p.y + mouse.py * 15, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${p.opacity})`
        ctx.fill()
      })
      ctx.restore()
    }

    if (!prefersReducedMotion) {
      const loop = (now) => {
        const elapsed = (now - startTime) / 1000
        drawFrame(elapsed)
        animId = requestAnimationFrame(loop)
      }
      animId = requestAnimationFrame(loop)
    } else {
      drawFrame(5)
    }

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('pointermove', handlePointerMove)
      if (animId) cancelAnimationFrame(animId)
    }
  }, [])

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0"
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
      />
    </div>
  )
}
