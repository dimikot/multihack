'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@google/genai'
import { createGeminiSession } from '@/lib/gemini-live-client'
import { WordTracker } from '@/lib/word-tracker'
import { AudioCapture } from '@/lib/audio-capture'
import type {
  SessionPhase,
  CoachingMessage,
  SessionAnalytics,
  GeminiPositionUpdate,
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
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const coachingRef = useRef<CoachingMessage[]>([])
  const paceHistoryRef = useRef<{ timeSeconds: number; wpm: number }[]>([])
  const fillerMapRef = useRef<Map<string, number>>(new Map())

  const handleGeminiMessage = useCallback((update: GeminiPositionUpdate) => {
    const tracker = trackerRef.current
    if (!tracker) return

    tracker.updatePosition(update.wordIndex)
    setWordsPerMinute(tracker.getAverageWPM())
    setProgress(tracker.getProgress() * 100)

    const elapsed = (Date.now() - startTimeRef.current) / 1000
    paceHistoryRef.current.push({
      timeSeconds: Math.round(elapsed),
      wpm: tracker.getAverageWPM(),
    })

    if (update.coaching) {
      const msg: CoachingMessage = {
        id: crypto.randomUUID(),
        type: update.coaching.type,
        message: update.coaching.message,
        data: update.coaching.data,
        timestamp: Date.now(),
      }
      coachingRef.current = [...coachingRef.current, msg]
      setCoachingMessages(coachingRef.current)

      if (update.coaching.type === 'filler_word' && update.coaching.data?.word) {
        const word = String(update.coaching.data.word)
        fillerMapRef.current.set(word, (fillerMapRef.current.get(word) ?? 0) + 1)
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
    fillerMapRef.current.clear()

    try {
      const res = await fetch('/api/gemini-session')
      const { apiKey } = await res.json()
      if (!apiKey) throw new Error('Failed to get API key')

      const tracker = new WordTracker(scriptWords)
      tracker.onChange = (index) => {
        setCurrentWordIndex(index)
        setProgress(tracker.getProgress() * 100)
        setWordsPerMinute(tracker.getAverageWPM())
      }
      trackerRef.current = tracker
      tracker.start()

      const audio = new AudioCapture()
      audio.onVolume = setVolume
      audioRef.current = audio

      const session = await createGeminiSession(
        apiKey,
        script,
        handleGeminiMessage,
        (err) => setError(err.message),
      )
      sessionRef.current = session

      audio.onData = (base64) => {
        session.sendRealtimeInput({
          media: { data: base64, mimeType: 'audio/pcm;rate=16000' },
        })
      }

      await audio.start()

      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      setPhase('reading')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed')
      setPhase('idle')
    }
  }, [handleGeminiMessage])

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
    const fillerWords = Array.from(fillerMapRef.current.entries()).map(
      ([word, count]) => ({ word, count })
    )

    setAnalytics({
      totalDurationSeconds: Math.round(elapsed),
      averageWPM: trackerRef.current?.getAverageWPM() ?? 0,
      paceOverTime: paceHistoryRef.current,
      fillerWords,
      offScriptMoments: [],
      recommendations: coachingRef.current
        .filter((m) => m.type !== 'encouragement' && m.type !== 'section_complete')
        .slice(-5)
        .map((m) => m.message),
    })

    trackerRef.current = null
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
