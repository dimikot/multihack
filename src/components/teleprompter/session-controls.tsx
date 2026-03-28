"use client"

import { Pause, Play, Square, RotateCcw, Minus, Plus } from "lucide-react"

interface SessionControlsProps {
  isIdle: boolean
  isReading: boolean
  isFinished: boolean
  isPaused: boolean
  elapsedSeconds: number
  wordsPerMinute: number
  progress: number
  fontSize: number
  onFontSizeChange: (size: number) => void
  onStart: () => void
  onPause: () => void
  onResume: () => void
  onStop: () => void
  onRestart: () => void
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
}

export function SessionControls({
  isIdle,
  isReading,
  isFinished,
  isPaused,
  elapsedSeconds,
  wordsPerMinute,
  progress,
  fontSize,
  onFontSizeChange,
  onStart,
  onPause,
  onResume,
  onStop,
  onRestart,
}: SessionControlsProps) {
  if (!isIdle && !isReading) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
        <div className="flex items-center gap-4 text-sm text-zinc-400">
          <span className="font-mono">{formatTime(elapsedSeconds)}</span>
          <span>{Math.round(wordsPerMinute)} WPM</span>
          <span>{Math.round(progress)}%</span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onFontSizeChange(Math.max(24, fontSize - 8))}
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <Minus className="size-3.5" />
            </button>
            <span className="w-8 text-center text-xs font-mono">{fontSize}</span>
            <button
              onClick={() => onFontSizeChange(Math.min(120, fontSize + 8))}
              className="rounded p-1 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-zinc-200"
            >
              <Plus className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isIdle ? (
            <button
              onClick={onStart}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <Play className="size-4" />
              Play
            </button>
          ) : isFinished ? (
            <button
              onClick={onRestart}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 text-sm font-medium text-white transition-opacity hover:opacity-90"
            >
              <RotateCcw className="size-4" />
              Start Over
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}
