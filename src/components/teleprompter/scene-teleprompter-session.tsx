'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Info } from 'lucide-react'
import { useTeleprompterSession } from '@/hooks/use-teleprompter-session'
import { WordDisplay } from './word-display'
import { PaceGlow } from './pace-glow'
import { AudioVisualizer } from './audio-visualizer'
import { SessionControls } from './session-controls'
import { AnalyticsModal } from './analytics-modal'

interface SceneTeleprompterSessionProps {
  script: string
}

export function SceneTeleprompterSession({ script }: SceneTeleprompterSessionProps) {
  const {
    phase,
    words,
    currentWordIndex,
    coachingMessages,
    analytics,
    volume,
    isPaused,
    elapsedSeconds,
    wordsPerMinute,
    progress,
    error,
    start,
    pause,
    resume,
    stop,
    reset,
    restart,
  } = useTeleprompterSession()

  const [showAnalytics, setShowAnalytics] = useState(false)

  const togglePause = useCallback(() => {
    if (phase !== 'reading') return
    isPaused ? resume() : pause()
  }, [phase, isPaused, pause, resume])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return
      if (e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLInputElement) return
      e.preventDefault()
      togglePause()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [togglePause])

  useEffect(() => {
    if (phase !== 'finished') setShowAnalytics(false)
  }, [phase])

  if (phase === 'idle') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-8 px-8">
        <p className="max-w-xl text-center text-lg leading-relaxed text-zinc-300 line-clamp-6">
          {script}
        </p>
        <button
          onClick={() => start(script)}
          className="rounded-lg bg-blue-600 px-8 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-500"
        >
          Start Reading
        </button>
        <Link href="/scenes" className="text-sm text-zinc-500 hover:text-zinc-300">
          ← Back to Scenes
        </Link>
      </div>
    )
  }

  if (phase === 'connecting') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
          <p className="text-zinc-400">Connecting to Gemini...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {error && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-500/20 px-4 py-2 text-sm text-red-200 backdrop-blur-md">
          {error}
        </div>
      )}

      <PaceGlow messages={coachingMessages} />

      <WordDisplay words={words} currentIndex={currentWordIndex} progress={progress} />

      <button
        onClick={() => phase === 'finished' && setShowAnalytics(true)}
        disabled={phase !== 'finished'}
        className={`fixed right-4 top-4 z-50 rounded-lg p-2 transition-all ${
          phase === 'finished'
            ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-500'
            : 'cursor-default bg-zinc-800/50 text-zinc-600'
        }`}
      >
        <Info className="size-5" />
      </button>

      {phase === 'reading' && (
        <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center">
          <AudioVisualizer volume={volume} isActive={!isPaused} />
        </div>
      )}

      <SessionControls
        isReading={phase === 'reading' || phase === 'finished'}
        isFinished={phase === 'finished'}
        isPaused={isPaused}
        elapsedSeconds={elapsedSeconds}
        wordsPerMinute={wordsPerMinute}
        progress={progress}
        onPause={pause}
        onResume={resume}
        onStop={stop}
        onRestart={restart}
      />

      <AnalyticsModal
        open={showAnalytics}
        analytics={analytics}
        onClose={() => setShowAnalytics(false)}
      />
    </>
  )
}
