'use client'

import { useEffect, useState } from 'react'
import {
  Gauge,
  MessageCircleWarning,
  AlertTriangle,
  CheckCircle,
  Star,
  Trophy,
} from 'lucide-react'
import type { CoachingMessage, CoachingType } from '@/lib/types'

const iconMap: Record<CoachingType, React.ComponentType<{ className?: string }>> = {
  pace_slow: Gauge,
  pace_fast: Gauge,
  filler_word: MessageCircleWarning,
  off_script: AlertTriangle,
  back_on_script: CheckCircle,
  encouragement: Star,
  section_complete: Trophy,
}

const colorMap: Record<CoachingType, string> = {
  pace_slow: 'bg-amber-500/20 border-amber-500/40 text-amber-200',
  pace_fast: 'bg-yellow-500/20 border-yellow-500/40 text-yellow-200',
  filler_word: 'bg-orange-500/20 border-orange-500/40 text-orange-200',
  off_script: 'bg-red-500/20 border-red-500/40 text-red-200',
  back_on_script: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200',
  encouragement: 'bg-green-500/20 border-green-500/40 text-green-200',
  section_complete: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-200',
}

const iconColorMap: Record<CoachingType, string> = {
  pace_slow: 'text-amber-400',
  pace_fast: 'text-yellow-400',
  filler_word: 'text-orange-400',
  off_script: 'text-red-400',
  back_on_script: 'text-emerald-400',
  encouragement: 'text-green-400',
  section_complete: 'text-emerald-400',
}

interface CoachingOverlayProps {
  messages: CoachingMessage[]
}

export function CoachingOverlay({ messages }: CoachingOverlayProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      setDismissedIds((prev) => {
        const next = new Set(prev)
        let changed = false
        for (const msg of messages) {
          if (now - msg.timestamp > 4000 && !prev.has(msg.id)) {
            next.add(msg.id)
            changed = true
          }
        }
        return changed ? next : prev
      })
    }, 500)
    return () => clearInterval(interval)
  }, [messages])

  const visible = messages
    .filter((m) => !dismissedIds.has(m.id))
    .slice(-3)

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-80">
      {visible.map((msg) => {
        const Icon = iconMap[msg.type]
        const isStale = Date.now() - msg.timestamp > 3500

        return (
          <div
            key={msg.id}
            className={`
              flex items-start gap-3 rounded-lg border px-4 py-3
              backdrop-blur-md transition-all duration-300
              ${colorMap[msg.type]}
              ${isStale ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}
            `}
          >
            <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${iconColorMap[msg.type]}`} />
            <span className="text-sm leading-snug">{msg.message}</span>
          </div>
        )
      })}

    </div>
  )
}
