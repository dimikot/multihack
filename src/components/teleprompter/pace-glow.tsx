'use client'

import { useEffect, useState } from 'react'
import type { CoachingMessage } from '@/lib/types'

type PaceState = 'normal' | 'slow' | 'fast'

const glowStyles: Record<PaceState, { from: string; to: string }> = {
  normal: { from: 'rgba(34,197,94,0.12)', to: 'rgba(34,197,94,0)' },
  slow: { from: 'rgba(59,130,246,0.18)', to: 'rgba(59,130,246,0)' },
  fast: { from: 'rgba(239,68,68,0.18)', to: 'rgba(239,68,68,0)' },
}

interface PaceGlowProps {
  messages: CoachingMessage[]
}

export function PaceGlow({ messages }: PaceGlowProps) {
  const [pace, setPace] = useState<PaceState>('normal')

  useEffect(() => {
    const last = [...messages].reverse().find(
      (m) => m.type === 'pace_slow' || m.type === 'pace_fast'
    )
    if (!last) {
      setPace('normal')
      return
    }
    if (Date.now() - last.timestamp > 8000) {
      setPace('normal')
      return
    }
    setPace(last.type === 'pace_slow' ? 'slow' : 'fast')
  }, [messages])

  useEffect(() => {
    if (pace === 'normal') return
    const timer = setTimeout(() => setPace('normal'), 8000)
    return () => clearTimeout(timer)
  }, [pace])

  const { from, to } = glowStyles[pace]

  return (
    <div
      className="pointer-events-none fixed inset-0 z-30 transition-all duration-[1500ms]"
      style={{
        background: `radial-gradient(ellipse at right center, ${from} 0%, ${to} 70%)`,
      }}
    />
  )
}
