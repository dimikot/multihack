import {
  GoogleGenAI,
  Modality,
  type Session,
  type LiveServerMessage,
} from '@google/genai'

export async function createGeminiLiveSession(
  apiKey: string,
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
      inputAudioTranscription: {},
      outputAudioTranscription: {},
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
