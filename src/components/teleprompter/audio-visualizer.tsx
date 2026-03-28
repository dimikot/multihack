'use client'

import { useMemo } from 'react'

interface AudioVisualizerProps {
  volume: number
  isActive: boolean
}

const BAR_COUNT = 16

export function AudioVisualizer({ volume, isActive }: AudioVisualizerProps) {
  const barHeights = useMemo(() => {
    if (!isActive) return Array(BAR_COUNT).fill(2)

    return Array.from({ length: BAR_COUNT }, (_, i) => {
      const base = volume * 22
      const variation = Math.sin(i * 0.8 + volume * 10) * 0.4 + 0.6
      return Math.max(2, Math.min(24, base * variation + 2))
    })
  }, [volume, isActive])

  return (
    <div className="flex h-8 items-end justify-center gap-[3px]">
      {barHeights.map((height, i) => (
        <div
          key={i}
          className="w-1.5 rounded-full transition-all duration-150"
          style={{
            height: `${height}px`,
            background: `linear-gradient(to top, rgb(59 130 246), rgb(168 85 247))`,
            opacity: isActive ? 0.9 : 0.3,
          }}
        />
      ))}
    </div>
  )
}
