'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@google/genai'
import {
  createGeminiSession,
  createWordMatcher,
  type TranscriptionUpdate,
} from '@/lib/gemini-live-client'
import { WordTracker } from '@/lib/word-tracker'
import { AudioCapture } from '@/lib/audio-capture'
import type {
  SessionPhase,
  CoachingMessage,
  SessionAnalytics,
} from '@/lib/types'

export function useTeleprompterSession() {
  const [phase, setPhase] = useState<SessionPhase>('idle')
  const [words, setWords] = useState<string[]>([])
  const [currentWordIndex, setCurrentWordIndex] = useState(0)
  const [coachingMessages, setCoachingMessages] = useState<CoachingMessage[]>([])
  const [analytics, setAnalytics] = useState<SessionAnalytics | null>(null)
  const [volume, setVolume] = useState(0)
  const [isPaused, setIsPaused] = useState(false)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [wordsPerMinute, setWordsPerMinute] = useState(0)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const sessionRef = useRef<Session | null>(null)
  const audioRef = useRef<AudioCapture | null>(null)
  const trackerRef = useRef<WordTracker | null>(null)
  const matcherRef = useRef<ReturnType<typeof createWordMatcher> | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const coachingRef = useRef<CoachingMessage[]>([])
  const paceHistoryRef = useRef<{ timeSeconds: number; wpm: number }[]>([])
  const outputBufferRef = useRef('')

  const handleTranscription = useCallback((update: TranscriptionUpdate) => {
    const tracker = trackerRef.current
    const matcher = matcherRef.current
    if (!tracker || !matcher) return

    if (update.inputText) {
      const matchedIndex = matcher.matchTranscription(update.inputText)
      if (matchedIndex !== null) {
        tracker.updatePosition(matchedIndex)
        setCurrentWordIndex(matchedIndex)
        setWordsPerMinute(tracker.getAverageWPM())
        setProgress(tracker.getProgress() * 100)

        const elapsed = (Date.now() - startTimeRef.current) / 1000
        paceHistoryRef.current.push({
          timeSeconds: Math.round(elapsed),
          wpm: tracker.getAverageWPM(),
        })
      }
    }

    if (update.outputText) {
      outputBufferRef.current += update.outputText
      if (outputBufferRef.current.length > 5) {
        const msg: CoachingMessage = {
          id: crypto.randomUUID(),
          type: 'encouragement',
          message: outputBufferRef.current.trim(),
          timestamp: Date.now(),
        }
        coachingRef.current = [...coachingRef.current, msg]
        setCoachingMessages([...coachingRef.current])
        outputBufferRef.current = ''
      }
    }
  }, [])

  const start = useCallback(async (script: string) => {
    setPhase('connecting')
    setError(null)

    const scriptWords = script.trim().split(/\s+/)
    setWords(scriptWords)
    setCurrentWordIndex(0)
    setCoachingMessages([])
    setAnalytics(null)
    setElapsedSeconds(0)
    setWordsPerMinute(0)
    setProgress(0)
    setIsPaused(false)
    coachingRef.current = []
    paceHistoryRef.current = []
    outputBufferRef.current = ''

    try {
      console.log('[START] Starting audio capture...')
      const audio = new AudioCapture()
      audio.onVolume = setVolume
      audioRef.current = audio
      await audio.start()
      console.log('[START] Audio capture running')

      console.log('[START] Fetching API key...')
      const res = await fetch('/api/gemini-session')
      const { apiKey } = await res.json()
      if (!apiKey) throw new Error('Failed to get API key')

      const tracker = new WordTracker(scriptWords)
      trackerRef.current = tracker
      tracker.start()

      const matcher = createWordMatcher(scriptWords)
      matcherRef.current = matcher

      console.log('[START] Connecting to Gemini Live...')
      const session = await createGeminiSession(
        apiKey,
        script,
        handleTranscription,
        (err) => {
          console.error('[GEMINI] Session error:', err.message)
          setError(err.message)
        },
      )
      sessionRef.current = session

      let audioChunkCount = 0
      audio.onData = (base64) => {
        audioChunkCount++
        if (audioChunkCount % 20 === 1) {
          console.log(`[AUDIO] Sending chunk #${audioChunkCount} (${base64.length} chars base64)`)
        }
        try {
          session.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' },
          })
        } catch (e) {
          console.error('[AUDIO] Failed to send:', e)
        }
      }

      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      setPhase('reading')
      console.log('[START] Session fully started')
    } catch (err) {
      console.error('[START] Failed:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
      setPhase('idle')
    }
  }, [handleTranscription])

  const pause = useCallback(() => {
    audioRef.current?.pause()
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    audioRef.current?.resume()
    setIsPaused(false)
  }, [])

  const stop = useCallback(() => {
    audioRef.current?.stop()
    audioRef.current = null
    trackerRef.current?.stop()
    sessionRef.current?.close()
    sessionRef.current = null

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const elapsed = (Date.now() - startTimeRef.current) / 1000

    setAnalytics({
      totalDurationSeconds: Math.round(elapsed),
      averageWPM: trackerRef.current?.getAverageWPM() ?? 0,
      paceOverTime: paceHistoryRef.current,
      fillerWords: [],
      offScriptMoments: [],
      recommendations: coachingRef.current
        .slice(-5)
        .map((m) => m.message),
    })

    trackerRef.current = null
    matcherRef.current = null
    setVolume(0)
    setIsPaused(false)
    setPhase('finished')
  }, [])

  const reset = useCallback(() => {
    setPhase('idle')
    setAnalytics(null)
    setWords([])
    setCurrentWordIndex(0)
    setCoachingMessages([])
    setError(null)
  }, [])

  useEffect(() => {
    return () => {
      audioRef.current?.stop()
      trackerRef.current?.stop()
      sessionRef.current?.close()
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [])

  return {
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
  }
}
