'use client'

import { useEffect, useState } from 'react'

interface LoadingScreenProps {
  show: boolean
}

export function LoadingScreen({ show }: LoadingScreenProps) {
  const [visible, setVisible] = useState(true)
  const [fadingOut, setFadingOut] = useState(false)

  useEffect(() => {
    if (!show) {
      setFadingOut(true)
      const t = setTimeout(() => setVisible(false), 550)
      return () => clearTimeout(t)
    }
  }, [show])

  if (!visible) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center select-none"
      style={{
        background: '#060e20',
        opacity: fadingOut ? 0 : 1,
        transition: 'opacity 0.55s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: fadingOut ? 'none' : 'all',
      }}
    >
      {/* Radial ambient glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 700px 500px at 50% 45%, rgba(255,193,116,0.07) 0%, transparent 70%)',
        }}
      />

      {/* Spinning rings + center icon */}
      <div className="relative flex items-center justify-center mb-10">

        {/* Outermost glow ring (static pulse) */}
        <div
          className="absolute w-36 h-36 rounded-full"
          style={{ animation: 'pulse-gold 2.4s ease-in-out infinite', border: '1px solid rgba(255,193,116,0.12)' }}
        />

        {/* Outer ring — clockwise, gradient conic */}
        <div
          className="absolute w-28 h-28 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, #ffc174 0%, rgba(255,193,116,0.18) 55%, transparent 72%)',
            animation: 'spin-cw 1.8s linear infinite',
            padding: '2.5px',
          }}
        >
          <div className="w-full h-full rounded-full" style={{ background: '#060e20' }} />
        </div>

        {/* Inner ring — counter-clockwise, amber tint */}
        <div
          className="absolute w-20 h-20 rounded-full"
          style={{
            background: 'conic-gradient(from 180deg, #f59e0b 0%, rgba(245,158,11,0.12) 55%, transparent 72%)',
            animation: 'spin-ccw 1.2s linear infinite',
            padding: '2px',
          }}
        >
          <div className="w-full h-full rounded-full" style={{ background: '#060e20' }} />
        </div>

        {/* Center gold coin */}
        <div
          className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center font-bold text-xl"
          style={{
            background: 'linear-gradient(135deg, #ffddb8 0%, #ffc174 45%, #f59e0b 100%)',
            color: '#7c3f00',
            animation: 'pulse-gold 2.4s ease-in-out infinite',
            boxShadow: '0 0 0 3px rgba(255,193,116,0.15)',
          }}
        >
          ₫
        </div>
      </div>

      {/* Subtitle */}
      <p
        className="text-[#d8c3ad] text-sm mb-10 tracking-wide"
        style={{ animation: 'fade-in-up 0.5s ease 0.15s both' }}
      >
        Đang tải dữ liệu...
      </p>

      {/* Bouncing dots */}
      <div className="flex gap-2.5" style={{ animation: 'fade-in-up 0.5s ease 0.25s both' }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full"
            style={{
              background: '#ffc174',
              animation: `bounce-dot 1.3s ease-in-out ${i * 0.18}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
