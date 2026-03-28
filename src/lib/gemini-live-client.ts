import {
  GoogleGenAI,
  Modality,
  type Session,
  type LiveServerMessage,
} from '@google/genai'

export async function createGeminiLiveSession(
  apiKey: string,
  script: string,
  onInputTranscription: (text: string) => void,
  onCoaching: (text: string) => void,
  onError: (error: Error) => void,
): Promise<Session> {
  const ai = new GoogleGenAI({ apiKey })

  let setupResolve: () => void
  const setupPromise = new Promise<void>((resolve) => {
    setupResolve = resolve
  })

  const setupTimeout = setTimeout(() => {
    console.warn('[LIVE] setupComplete timeout — proceeding anyway')
    setupResolve()
  }, 10000)

  let outputBuffer = ''

  const session = await ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-latest',
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: 'Puck' },
        },
      },
      systemInstruction: `You are a real-time speech coach. The speaker is reading this script aloud:

${script}

Rules:
- MOSTLY STAY SILENT. Only speak when coaching is truly needed.
- Speak at most once every 15 seconds.
- When to speak: filler words detected, pace too slow/fast, speaker went off-script, or encouragement at 25/50/75/100%.
- Keep messages under 10 words.
- Speak in the same language as the script.
- Do NOT repeat or narrate the script.`,
      outputAudioTranscription: {},
      inputAudioTranscription: {},
    },
    callbacks: {
      onopen: () => console.log('[LIVE] WebSocket opened'),
      onmessage: (msg: LiveServerMessage) => {
        if (msg.setupComplete) {
          console.log('[LIVE] Setup complete')
          clearTimeout(setupTimeout)
          setupResolve()
          return
        }

        if (msg.serverContent?.inputTranscription?.text) {
          onInputTranscription(msg.serverContent.inputTranscription.text)
        }

        if (msg.serverContent?.outputTranscription?.text) {
          outputBuffer += msg.serverContent.outputTranscription.text
        }

        if (msg.serverContent?.turnComplete && outputBuffer) {
          console.log('[LIVE] Coaching:', outputBuffer)
          onCoaching(outputBuffer.trim())
          outputBuffer = ''
        }
      },
      onerror: (e: ErrorEvent) => {
        console.error('[LIVE] Error:', e)
        onError(new Error(e.message || 'WebSocket error'))
      },
      onclose: (e: CloseEvent) => {
        if (e.code !== 1000) {
          console.error('[LIVE] Closed:', e.code, e.reason)
          onError(new Error(`Connection closed: ${e.code} ${e.reason}`))
        }
      },
    },
  })

  await setupPromise
  console.log('[LIVE] Ready')
  return session
}
