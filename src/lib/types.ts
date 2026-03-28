export type CoachingType =
  | 'pace_slow'
  | 'pace_fast'
  | 'filler_word'
  | 'off_script'
  | 'back_on_script'
  | 'encouragement'
  | 'section_complete'

export interface CoachingMessage {
  id: string
  type: CoachingType
  message: string
  data?: Record<string, unknown>
  timestamp: number
}

export interface GeminiPositionUpdate {
  wordIndex: number
  coaching: {
    type: CoachingType
    message: string
    data?: Record<string, unknown>
  } | null
}

export interface SessionAnalytics {
  totalDurationSeconds: number
  averageWPM: number
  paceOverTime: { timeSeconds: number; wpm: number }[]
  fillerWords: { word: string; count: number }[]
  offScriptMoments: { timeSeconds: number; durationSeconds: number }[]
  recommendations: string[]
}

export type SessionPhase = 'idle' | 'connecting' | 'reading' | 'finished'

