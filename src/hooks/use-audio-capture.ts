'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AudioCapture } from '@/lib/audio-capture'

export function useAudioCapture(
  onData?: (data: string) => void,
) {
  const [isRecording, setIsRecording] = useState(false)
  const [volume, setVolume] = useState(0)
  const captureRef = useRef<AudioCapture | null>(null)

  const start = useCallback(async () => {
    const capture = new AudioCapture()
    capture.onData = onData ?? null
    capture.onVolume = setVolume
    captureRef.current = capture

    await capture.start()
    setIsRecording(true)
  }, [onData])

  const stop = useCallback(async () => {
    await captureRef.current?.stop()
    captureRef.current = null
    setIsRecording(false)
    setVolume(0)
  }, [])

  const pause = useCallback(() => {
    captureRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    captureRef.current?.resume()
  }, [])

  useEffect(() => {
    return () => {
      captureRef.current?.stop()
    }
  }, [])

  return { start, stop, pause, resume, isRecording, volume }
}
