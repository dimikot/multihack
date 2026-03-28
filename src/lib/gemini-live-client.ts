import {
  GoogleGenAI,
  Modality,
  type Session,
  type LiveServerMessage,
} from '@google/genai'
import type { GeminiPositionUpdate } from './types'

export function buildSystemPrompt(script: string, language: string): string {
  const words = script.split(/\s+/)
  const numbered = words.map((w, i) => `[${i}] ${w}`).join(' ')
  const totalWords = words.length
  return `You are a real-time teleprompter coach. The speaker is reading a script aloud and you are listening to their audio. Your job is to track their position in the script and provide occasional coaching.

## Script (${totalWords} words total)
${numbered}

## Your Task
1. Listen to the speaker's audio and determine which word they are currently on.
2. Respond with ONLY valid JSON on every turn, no other text. Format:
   {"wordIndex": <number>, "coaching": <object or null>}

   Where coaching, when present, is:
   {"type": "<coaching_type>", "message": "<short message>", "data": {}}

   Valid coaching types: pace_slow, pace_fast, filler_word, off_script, back_on_script, encouragement, section_complete

3. wordIndex must be the 0-based index of the word the speaker most recently said or is currently saying.

## Coaching Rules
- Provide coaching at most once every 5 seconds. Most responses should have "coaching": null.
- pace_slow: speaker is significantly below 120 WPM for more than 10 seconds.
- pace_fast: speaker is significantly above 180 WPM for more than 5 seconds.
- filler_word: detect filler words yourself based on the speech language. Include {"word": "<detected>"} in data.
- off_script: speaker deviated significantly from the script text.
- back_on_script: speaker returned to the script after being off-script.
- encouragement: speaker has been reading well for 30+ seconds. Keep it brief.
- section_complete: speaker reached roughly 25%, 50%, 75%, or 100% of the script.

## Important
- Respond with JSON ONLY. No markdown, no explanation, no extra text.
- If you cannot determine the position, use the last known wordIndex.
- Keep coaching messages short (under 10 words).
- The speaker is reading in ${language}. All coaching messages must be in ${language}.`
}

export async function createGeminiSession(
  apiKey: string,
  script: string,
  language: string,
  onMessage: (update: GeminiPositionUpdate) => void,
  onError: (error: Error) => void,
): Promise<Session> {
  const ai = new GoogleGenAI({ apiKey })

  const session = await ai.live.connect({
    model: 'gemini-live-2.5-flash-preview',
    config: {
      responseModalities: [Modality.TEXT],
      systemInstruction: buildSystemPrompt(script, language),
    },
    callbacks: {
      onopen: () => console.log('Gemini Live connected'),
      onmessage: (msg: LiveServerMessage) => {
        const text = msg.serverContent?.modelTurn?.parts
          ?.map((p) => p.text)
          .filter(Boolean)
          .join('')

        if (!text) return

        try {
          const cleaned = text.replace(/```json\s*|```\s*/g, '').trim()
          const parsed = JSON.parse(cleaned) as GeminiPositionUpdate
          if (typeof parsed.wordIndex === 'number') {
            onMessage(parsed)
          }
        } catch {
          // Gemini occasionally returns non-JSON; silently skip
        }
      },
      onerror: (e: ErrorEvent) => onError(new Error(e.message)),
    },
  })

  return session
}
