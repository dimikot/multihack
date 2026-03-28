'use client'

import { X } from 'lucide-react'
import type { SessionAnalytics } from '@/lib/types'

interface AnalyticsModalProps {
  open: boolean
  analytics: SessionAnalytics | null
  onClose: () => void
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

function PaceChart({ data }: { data: SessionAnalytics['paceOverTime'] }) {
  if (data.length < 2) return null

  const width = 500
  const height = 150
  const padding = { top: 10, right: 10, bottom: 24, left: 40 }
  const chartW = width - padding.left - padding.right
  const chartH = height - padding.top - padding.bottom

  const maxTime = Math.max(...data.map((d) => d.timeSeconds))
  const minWPM = Math.min(...data.map((d) => d.wpm))
  const maxWPM = Math.max(...data.map((d) => d.wpm))
  const wpmRange = maxWPM - minWPM || 1

  const points = data
    .map((d) => {
      const x = padding.left + (d.timeSeconds / maxTime) * chartW
      const y = padding.top + chartH - ((d.wpm - minWPM) / wpmRange) * chartH
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div>
      <h3 className="mb-2 text-sm font-medium text-zinc-400">Pace Over Time</h3>
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
        <line
          x1={padding.left}
          y1={padding.top + chartH}
          x2={padding.left + chartW}
          y2={padding.top + chartH}
          stroke="rgb(63 63 70)"
          strokeWidth={1}
        />
        <line
          x1={padding.left}
          y1={padding.top}
          x2={padding.left}
          y2={padding.top + chartH}
          stroke="rgb(63 63 70)"
          strokeWidth={1}
        />
        <text
          x={padding.left - 4}
          y={padding.top + 4}
          textAnchor="end"
          className="fill-zinc-500 text-[10px]"
        >
          {Math.round(maxWPM)}
        </text>
        <text
          x={padding.left - 4}
          y={padding.top + chartH + 4}
          textAnchor="end"
          className="fill-zinc-500 text-[10px]"
        >
          {Math.round(minWPM)}
        </text>
        <text
          x={padding.left + chartW}
          y={padding.top + chartH + 16}
          textAnchor="end"
          className="fill-zinc-500 text-[10px]"
        >
          {formatDuration(maxTime)}
        </text>
        <polyline
          fill="none"
          stroke="url(#paceGradient)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          points={points}
        />
        <defs>
          <linearGradient id="paceGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgb(59 130 246)" />
            <stop offset="100%" stopColor="rgb(168 85 247)" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  )
}

export function AnalyticsModal({ open, analytics, onClose }: AnalyticsModalProps) {
  if (!open || !analytics) return null

  const totalFillers = analytics.fillerWords.reduce((sum, f) => sum + f.count, 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-2xl rounded-2xl bg-zinc-900 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-zinc-100">Speech Analytics</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div className="rounded-xl bg-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-zinc-100">
              {formatDuration(analytics.totalDurationSeconds)}
            </div>
            <div className="mt-1 text-xs text-zinc-400">Duration</div>
          </div>
          <div className="rounded-xl bg-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-zinc-100">
              {Math.round(analytics.averageWPM)}
            </div>
            <div className="mt-1 text-xs text-zinc-400">Average WPM</div>
          </div>
          <div className="rounded-xl bg-zinc-800 p-4 text-center">
            <div className="text-2xl font-bold text-zinc-100">{totalFillers}</div>
            <div className="mt-1 text-xs text-zinc-400">Filler Words</div>
          </div>
        </div>

        {analytics.paceOverTime.length >= 2 && (
          <div className="mb-6">
            <PaceChart data={analytics.paceOverTime} />
          </div>
        )}

        {analytics.fillerWords.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-zinc-400">Filler Words</h3>
            <div className="flex flex-wrap gap-2">
              {analytics.fillerWords.map((fw) => (
                <span
                  key={fw.word}
                  className="rounded-full bg-orange-500/20 px-3 py-1 text-sm text-orange-300"
                >
                  {fw.word} <span className="font-semibold">&times;{fw.count}</span>
                </span>
              ))}
            </div>
          </div>
        )}

        {analytics.recommendations.length > 0 && (
          <div className="mb-6">
            <h3 className="mb-2 text-sm font-medium text-zinc-400">Recommendations</h3>
            <ul className="space-y-1.5">
              {analytics.recommendations.map((rec, i) => (
                <li key={i} className="flex gap-2 text-sm text-zinc-300">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-purple-400" />
                  {rec}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
        >
          Close
        </button>
      </div>

    </div>
  )
}
