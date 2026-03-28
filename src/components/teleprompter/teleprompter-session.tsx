'use client'

import { useTeleprompterSession } from '@/hooks/use-teleprompter-session'
import { ScriptEditor } from './script-editor'
import { WordDisplay } from './word-display'
import { CoachingOverlay } from './coaching-overlay'
import { AudioVisualizer } from './audio-visualizer'
import { SessionControls } from './session-controls'
import { AnalyticsModal } from './analytics-modal'

export function TeleprompterSession() {
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
  } = useTeleprompterSession()

  if (phase === 'idle') {
    return <ScriptEditor onStart={start} />
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
        <div className="fixed top-4 left-1/2 z-50 -translate-x-1/2 rounded-lg bg-red-500/20 border border-red-500/40 px-4 py-2 text-sm text-red-200 backdrop-blur-md">
          {error}
        </div>
      )}

      <WordDisplay
        words={words}
        currentIndex={currentWordIndex}
        progress={progress}
      />

      <CoachingOverlay messages={coachingMessages} />

      <div className="fixed inset-x-0 bottom-16 z-40 flex justify-center">
        <AudioVisualizer volume={volume} isActive={phase === 'reading' && !isPaused} />
      </div>

      <SessionControls
        isReading={phase === 'reading' || phase === 'finished'}
        isPaused={isPaused}
        elapsedSeconds={elapsedSeconds}
        wordsPerMinute={wordsPerMinute}
        progress={progress}
        onPause={pause}
        onResume={resume}
        onStop={stop}
      />

      <AnalyticsModal
        open={phase === 'finished'}
        analytics={analytics}
        onClose={reset}
      />
    </>
  )
}
