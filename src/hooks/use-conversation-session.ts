'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@google/genai'
import { createGeminiLiveSession } from '@/lib/gemini-live-client'
import { AudioCapture } from '@/lib/audio-capture'
import type { SessionPhase, ChatMessage, SessionAnalytics } from '@/lib/types'

function base64ToInt16(b64: string): Int16Array {
  const binary = atob(b64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return new Int16Array(bytes.buffer)
}

export function useConversationSession() {
  const [phase, setPhase] = useState<SessionPhase>('idle')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [volume, setVolume] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null)
  const [completedGoals, setCompletedGoals] = useState<Set<number>>(new Set())

  const sessionRef = useRef<Session | null>(null)
  const audioRef = useRef<AudioCapture | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const nextPlayTimeRef = useRef(0)
  const startTimeRef = useRef(0)
  const userSecsRef = useRef(0)
  const userWordCountRef = useRef(0)
  const goalResultRef = useRef<string | null>(null)
  const stoppedRef = useRef(false)
  const messagesRef = useRef<ChatMessage[]>([])
  const completedGoalsRef = useRef<Set<number>>(new Set())

  const updateMessages = (msgs: ChatMessage[]) => {
    messagesRef.current = msgs
    setMessages(msgs)
  }

  const playChunk = useCallback((b64: string) => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    try {
      const int16 = base64ToInt16(b64)
      const float32 = new Float32Array(int16.length)
      for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768
      const buf = ctx.createBuffer(1, float32.length, 24000)
      buf.copyToChannel(float32, 0)
      const src = ctx.createBufferSource()
      src.buffer = buf
      src.connect(ctx.destination)
      const startAt = Math.max(ctx.currentTime, nextPlayTimeRef.current)
      src.start(startAt)
      nextPlayTimeRef.current = startAt + buf.duration
    } catch {
      // audio context may be closed
    }
  }, [])

  const stop = useCallback(() => {
    if (stoppedRef.current) return
    stoppedRef.current = true

    audioRef.current?.stop()
    audioRef.current = null
    sessionRef.current?.close()
    sessionRef.current = null

    const elapsed = (Date.now() - startTimeRef.current) / 1000
    const userSecs = userSecsRef.current
    const wpm = userSecs > 0 ? Math.round((userWordCountRef.current / userSecs) * 60) : 0
    const talkRatioPct = elapsed > 0 ? Math.round((userSecs / elapsed) * 100) : 0

    const recs: string[] = []
    if (goalResultRef.current) recs.push(`🎯 ${goalResultRef.current}`)
    recs.push(`You spoke ${talkRatioPct}% of the session`)
    if (wpm > 160) recs.push('Try slowing down — you were above 160 WPM')
    if (wpm > 0 && wpm < 100) recs.push('Pick up the pace — aim for 120–150 WPM')

    setAnalytics({
      totalDurationSeconds: Math.round(elapsed),
      averageWPM: wpm,
      paceOverTime: [],
      fillerWords: [],
      offScriptMoments: [],
      recommendations: recs,
    })

    setVolume(0)
    setPhase('finished')
  }, [])

  const start = useCallback(async (script: string, goals: string[] = []) => {
    stoppedRef.current = false
    setPhase('connecting')
    setError(null)
    setMessages([])
    messagesRef.current = []
    setAnalytics(null)
    setCompletedGoals(new Set())
    completedGoalsRef.current = new Set()
    userSecsRef.current = 0
    userWordCountRef.current = 0
    goalResultRef.current = null
    nextPlayTimeRef.current = 0

    try {
      const audio = new AudioCapture()
      audio.onVolume = setVolume
      audioRef.current = audio
      await audio.start()

      audioCtxRef.current = new AudioContext({ sampleRate: 24000 })

      const res = await fetch('/api/gemini-session')
      const { apiKey } = await res.json()
      if (!apiKey) throw new Error('Failed to get API key')

      const session = await createGeminiLiveSession(
        apiKey,
        script,
        goals,
        (text) => {
          userSecsRef.current += 0.5
          userWordCountRef.current += text.trim().split(/\s+/).filter(Boolean).length

          const prev = messagesRef.current
          const last = prev[prev.length - 1]
          const now = Date.now()
          if (last?.role === 'user') {
            updateMessages([...prev.slice(0, -1), { ...last, text: last.text + ' ' + text }])
          } else {
            updateMessages([...prev, { id: crypto.randomUUID(), role: 'user', text, timestamp: now }])
          }
        },
        (b64) => playChunk(b64),
        (text) => {
          const now = Date.now()

          // Detect goal completions: GOAL_DONE:N (handles audio transcription variants like "goal done 1", "Goal_done: 2", etc.)
          const goalMatches = [...text.matchAll(/GOAL[_\s]*DONE[:\s]*(\d+)/gi)]
          if (goalMatches.length > 0) {
            const next = new Set(completedGoalsRef.current)
            for (const m of goalMatches) {
              next.add(Number(m[1]) - 1) // 0-indexed
            }
            completedGoalsRef.current = next
            setCompletedGoals(new Set(next))
          }

          // Strip GOAL_DONE tags from displayed text
          const cleanText = text.replace(/GOAL[_\s]*DONE[:\s]*\d+\s*/gi, '').trim()

          if (text.includes('SESSION_COMPLETE:')) {
            const result = text.split('SESSION_COMPLETE:')[1]?.trim()
            goalResultRef.current = result ?? null
            stop()
            return
          }

          if (!cleanText) return

          const prev = messagesRef.current
          const last = prev[prev.length - 1]
          if (last?.role === 'gemini') {
            updateMessages([...prev.slice(0, -1), { ...last, text: last.text + ' ' + cleanText }])
          } else {
            updateMessages([...prev, { id: crypto.randomUUID(), role: 'gemini', text: cleanText, timestamp: now }])
          }
        },
        (err) => {
          if (!err.message.includes('1000')) setError(err.message)
        },
      )
      sessionRef.current = session

      startTimeRef.current = Date.now()

      audio.onData = (base64) => {
        try {
          session.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' },
          })
        } catch {
          // session may have closed
        }
      }

      setPhase('reading')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setPhase('idle')
    }
  }, [playChunk, stop])

  const reset = useCallback(() => {
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    setPhase('idle')
    setAnalytics(null)
    setMessages([])
    messagesRef.current = []
    setCompletedGoals(new Set())
    completedGoalsRef.current = new Set()
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      audioRef.current?.stop()
      sessionRef.current?.close()
      audioCtxRef.current?.close()
    }
  }, [])

  return { phase, messages, volume, error, analytics, completedGoals, start, stop, reset }
}
