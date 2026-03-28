'use client'

import { useEffect, useRef } from 'react'
import { useConversationSession } from '@/hooks/use-conversation-session'
import { AudioVisualizer } from './audio-visualizer'
import { AnalyticsModal } from './analytics-modal'

export function SceneConversationSession({ script }: { script: string }) {
  const { phase, messages, volume, error, analytics, start, stop, reset } = useConversationSession()
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (phase === 'connecting') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-600 border-t-blue-500" />
          <p className="text-zinc-400">Connecting to Gemini...</p>
        </div>
      </div>
    )
  }

  if (phase === 'idle') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-6">
        <div className="flex w-full max-w-lg flex-col gap-6">
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="mb-1 text-xs font-medium uppercase tracking-widest text-zinc-500">Scenario</p>
            <p className="text-sm leading-relaxed text-zinc-300">{script}</p>
          </div>
          <button
            onClick={() => start(script)}
            className="flex h-14 items-center justify-center rounded-2xl bg-blue-600 text-base font-semibold text-white hover:bg-blue-500 active:scale-95 transition-all"
          >
            Start Conversation
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950">
      {error && (
        <div className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-lg border border-red-500/40 bg-red-500/20 px-4 py-2 text-sm text-red-200 backdrop-blur-md">
          {error}
        </div>
      )}

      {/* Chat bubbles */}
      <div className="flex-1 overflow-y-auto px-4 py-6 pb-32">
        <div className="mx-auto flex max-w-2xl flex-col gap-3">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'gemini' && (
                <span className="mr-2 mt-auto mb-1 text-xs font-medium text-zinc-500">AI</span>
              )}
              <div
                className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'rounded-br-sm bg-blue-600 text-white'
                    : 'rounded-bl-sm bg-zinc-800 text-zinc-100'
                }`}
              >
                {msg.text.trim()}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Bottom bar */}
      <div className="fixed inset-x-0 bottom-0 flex flex-col items-center gap-3 border-t border-zinc-800/60 bg-zinc-950/90 px-6 py-4 backdrop-blur-md">
        <AudioVisualizer volume={volume} isActive={phase === 'reading'} />
        <button
          onClick={stop}
          className="flex h-10 items-center rounded-xl bg-zinc-800 px-6 text-sm font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
        >
          End Session
        </button>
      </div>

      <AnalyticsModal
        open={phase === 'finished' && !!analytics}
        analytics={analytics}
        onClose={reset}
      />
    </div>
  )
}
