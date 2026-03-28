import {
  GoogleGenAI,
  Modality,
  StartSensitivity,
  EndSensitivity,
  type Session,
  type LiveServerMessage,
} from '@google/genai'

export async function createGeminiLiveSession(
  apiKey: string,
  onInputTranscription: (text: string) => void,
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

  const session = await ai.live.connect({
    model: 'gemini-2.5-flash-native-audio-latest',
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: {
        automaticActivityDetection: {
          startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
          endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_LOW,
          prefixPaddingMs: 0,
          silenceDurationMs: 3000,
        },
      },
      systemInstruction: 'You are listening to a speaker. Just listen silently.',
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
          const text = msg.serverContent.inputTranscription.text
          console.log('[LIVE] User said:', text)
          onInputTranscription(text)
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
