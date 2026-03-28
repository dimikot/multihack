'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Session } from '@google/genai'
import { createGeminiLiveSession } from '@/lib/gemini-live-client'
import { WordMatcher } from '@/lib/word-matcher'
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
  const wordTrackerRef = useRef<WordTracker | null>(null)
  const matcherRef = useRef<WordMatcher | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef(0)
  const scriptRef = useRef('')
  const coachingRef = useRef<CoachingMessage[]>([])

  const addCoaching = useCallback((type: CoachingMessage['type'], message: string) => {
    const msg: CoachingMessage = {
      id: crypto.randomUUID(),
      type,
      message,
      timestamp: Date.now(),
    }
    coachingRef.current = [...coachingRef.current, msg]
    setCoachingMessages([...coachingRef.current])
  }, [])

  const start = useCallback(async (script: string) => {
    setPhase('connecting')
    setError(null)
    scriptRef.current = script

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

    try {
      const audio = new AudioCapture()
      audio.onVolume = setVolume
      audioRef.current = audio
      await audio.start()

      const res = await fetch('/api/gemini-session')
      const { apiKey } = await res.json()
      if (!apiKey) throw new Error('Failed to get API key')

      const wordTracker = new WordTracker(scriptWords)
      wordTracker.onChange = (index) => {
        setCurrentWordIndex(index)
        setProgress(wordTracker.getProgress() * 100)
        setWordsPerMinute(wordTracker.getAverageWPM())
      }
      wordTrackerRef.current = wordTracker
      wordTracker.start()

      const matcher = new WordMatcher(scriptWords)
      matcherRef.current = matcher

      const session = await createGeminiLiveSession(
        apiKey,
        (text) => {
          const idx = matcher.addChunk(text)
          if (idx !== null) {
            wordTracker.updateSpeakerPosition(idx)
          }
        },
        (coachingText) => {
          addCoaching('encouragement', coachingText)
        },
        (err) => {
          if (!err.message.includes('1000')) {
            console.error('[LIVE] Error:', err.message)
            setError(err.message)
          }
        },
      )
      sessionRef.current = session

      let chunkCount = 0
      audio.onData = (base64) => {
        chunkCount++
        if (chunkCount % 50 === 1) {
          console.log(`[AUDIO] Chunk #${chunkCount}`)
        }
        try {
          session.sendRealtimeInput({
            audio: { data: base64, mimeType: 'audio/pcm;rate=16000' },
          })
        } catch {
          // Session may have closed
        }
      }

      startTimeRef.current = Date.now()
      timerRef.current = setInterval(() => {
        setElapsedSeconds(Math.floor((Date.now() - startTimeRef.current) / 1000))
      }, 1000)

      setPhase('reading')
    } catch (err) {
      console.error('[START] Failed:', err)
      setError(err instanceof Error ? err.message : 'Connection failed')
      setPhase('idle')
    }
  }, [addCoaching])

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
    wordTrackerRef.current?.stop()
    sessionRef.current?.close()
    sessionRef.current = null

    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    }

    const elapsed = (Date.now() - startTimeRef.current) / 1000

    setAnalytics({
      totalDurationSeconds: Math.round(elapsed),
      averageWPM: wordTrackerRef.current?.getAverageWPM() ?? 0,
      paceOverTime: [],
      fillerWords: [],
      offScriptMoments: [],
      recommendations: coachingRef.current
        .slice(-5)
        .map((m) => m.message),
    })

    wordTrackerRef.current = null
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

  const restart = useCallback(() => {
    const savedScript = scriptRef.current
    if (savedScript) {
      start(savedScript)
    } else {
      reset()
    }
  }, [start, reset])

  useEffect(() => {
    return () => {
      audioRef.current?.stop()
      wordTrackerRef.current?.stop()
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
    restart,
  }
}
