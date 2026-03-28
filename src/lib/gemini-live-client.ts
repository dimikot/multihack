import {
  GoogleGenAI,
  Modality,
  type Session,
  type LiveServerMessage,
} from '@google/genai'

export interface TranscriptionUpdate {
  inputText: string
  outputText: string | null
}

function buildSystemPrompt(script: string): string {
  return `You are a real-time speech coach. The speaker is reading a script aloud. Listen and provide brief coaching feedback ONLY when needed.

## Script
${script}

## When to speak (at most once every 10 seconds):
- Speaker is too slow (below 100 WPM for 10+ seconds) — say a brief encouragement to speed up
- Speaker is too fast (above 180 WPM for 5+ seconds) — suggest slowing down
- Speaker uses many filler words — gently point it out
- Speaker deviates significantly from the script — mention they went off-script
- Speaker reaches ~25%, 50%, 75%, 100% — brief encouragement

## Rules
- MOSTLY STAY SILENT. Only speak when coaching is truly needed.
- Keep messages under 10 words.
- Speak in the same language as the script.
- Do NOT repeat the script back. Do NOT narrate what the speaker is saying.`
}

function normalizeWord(w: string): string {
  return w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

export function createWordMatcher(scriptWords: string[]) {
  const normalized = scriptWords.map(normalizeWord)
  let currentIndex = 0

  return {
    matchTranscription(text: string): number | null {
      const spoken = text.trim().split(/\s+/).map(normalizeWord).filter(Boolean)
      if (spoken.length === 0) return null

      let matched = false
      for (const word of spoken) {
        if (!word) continue
        const searchStart = currentIndex
        const searchEnd = Math.min(currentIndex + 15, normalized.length)

        for (let i = searchStart; i < searchEnd; i++) {
          if (normalized[i] === word || normalized[i].startsWith(word) || word.startsWith(normalized[i])) {
            currentIndex = i + 1
            matched = true
            break
          }
        }
      }

      return matched ? currentIndex - 1 : null
    },

    getCurrentIndex() {
      return Math.max(0, currentIndex - 1)
    },
  }
}

export async function createGeminiSession(
  apiKey: string,
  script: string,
  onTranscription: (update: TranscriptionUpdate) => void,
  onError: (error: Error) => void,
): Promise<Session> {
  const ai = new GoogleGenAI({ apiKey })

  let setupResolve: () => void
  const setupPromise = new Promise<void>((resolve) => {
    setupResolve = resolve
  })

  const setupTimeout = setTimeout(() => {
    console.warn('[GEMINI] setupComplete timeout — proceeding anyway')
    setupResolve()
  }, 10000)

  const session = await ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-latest',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
      systemInstruction: buildSystemPrompt(script),
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
    callbacks: {
      onopen: () => console.log('[GEMINI] WebSocket opened'),
      onmessage: (msg: LiveServerMessage) => {
        if (msg.setupComplete) {
          console.log('[GEMINI] Setup complete')
          clearTimeout(setupTimeout)
          setupResolve()
          return
        }

        if (msg.serverContent?.inputTranscription?.text) {
          const text = msg.serverContent.inputTranscription.text
          console.log('[GEMINI] Input:', text)
          onTranscription({ inputText: text, outputText: null })
        }

        if (msg.serverContent?.outputTranscription?.text) {
          const text = msg.serverContent.outputTranscription.text
          console.log('[GEMINI] Output:', text)
          onTranscription({ inputText: '', outputText: text })
        }

        if (msg.serverContent?.turnComplete) {
          console.log('[GEMINI] Turn complete')
        }
      },
      onerror: (e: ErrorEvent) => {
        console.error('[GEMINI] Error:', e)
        onError(new Error(e.message || 'WebSocket error'))
      },
      onclose: (e: CloseEvent) => {
        if (e.code === 1000) {
          console.log('[GEMINI] Session ended normally')
        } else {
          console.error('[GEMINI] Closed:', e.code, e.reason)
          onError(new Error(`Connection closed: ${e.code} ${e.reason}`))
        }
      },
    },
  })

  console.log('[GEMINI] Waiting for setup...')
  await setupPromise
  console.log('[GEMINI] Ready')

  return session
}
