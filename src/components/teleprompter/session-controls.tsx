"use client"

import { Pause, Play, Square } from "lucide-react"

interface SessionControlsProps {
  isReading: boolean
  isPaused: boolean
  elapsedSeconds: number
  wordsPerMinute: number
  progress: number
  onPause: () => void
  onResume: () => void
  onStop: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function SessionControls({
  isReading,
  isPaused,
  elapsedSeconds,
  wordsPerMinute,
  progress,
  onPause,
  onResume,
  onStop,
}: SessionControlsProps) {
  if (!isReading) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-6 text-sm text-zinc-400">
          <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          <span>{Math.round(wordsPerMinute)} WPM</span>
          <span>{Math.round(progress)}%</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={isPaused ? onResume : onPause}
            className="rounded-lg bg-zinc-800 p-2 text-zinc-100 transition-colors hover:bg-zinc-700"
          >
            {isPaused ? <Play className="size-5" /> : <Pause className="size-5" />}
          </button>
          <button
            onClick={onStop}
            className="rounded-lg bg-zinc-800 p-2 text-red-400 transition-colors hover:bg-zinc-700"
          >
            <Square className="size-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
