import { GoogleGenAI } from '@google/genai'
import type { GeminiPositionUpdate } from './types'

export class PositionTracker {
  private ai: GoogleGenAI
  private scriptWords: string[]
  private numberedScript: string
  private transcriptionBuffer = ''
  private lastWordIndex = 0
  private pending = false
  private intervalId: ReturnType<typeof setInterval> | null = null
  private onUpdate: (update: GeminiPositionUpdate) => void

  constructor(
    apiKey: string,
    scriptWords: string[],
    onUpdate: (update: GeminiPositionUpdate) => void,
  ) {
    this.ai = new GoogleGenAI({ apiKey })
    this.scriptWords = scriptWords
    this.numberedScript = scriptWords.map((w, i) => `[${i}]${w}`).join(' ')
    this.onUpdate = onUpdate
  }

  addTranscription(chunk: string) {
    this.transcriptionBuffer += chunk
  }

  start() {
    this.intervalId = setInterval(() => this.tick(), 3000)
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async tick() {
    if (this.pending || !this.transcriptionBuffer.trim()) return
    this.pending = true

    const transcript = this.transcriptionBuffer.trim()

    try {
      const result = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Script with word indices:
${this.numberedScript}

What the speaker has said so far:
"${transcript}"

Last known position: word index ${this.lastWordIndex}

Return ONLY a JSON object: {"wordIndex": <number>, "coaching": <object or null>}
- wordIndex: the 0-based index of the word the speaker most recently said or is currently saying. Match spoken words to script words, ignoring filler words, pauses, minor mispronunciations, and small deviations.
- coaching: null in most cases. Only provide when clearly needed:
  {"type": "<type>", "message": "<short message in script language>"}
  Types: pace_slow, pace_fast, filler_word, off_script, back_on_script, encouragement, section_complete

JSON only, no markdown, no explanation.`,
        config: {
          responseMimeType: 'application/json',
          temperature: 0,
        },
      })

      const text = result.text?.trim()
      if (!text) return

      console.log('[TRACKER] Response:', text)

      const parsed = JSON.parse(text) as GeminiPositionUpdate
      if (typeof parsed.wordIndex === 'number' && parsed.wordIndex >= this.lastWordIndex) {
        this.lastWordIndex = parsed.wordIndex
        this.onUpdate(parsed)
      }
    } catch (e) {
      console.warn('[TRACKER] Error:', e)
    } finally {
      this.pending = false
    }
  }
}
