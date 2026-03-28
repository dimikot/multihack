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
  script: string,
  onInputTranscription: (text: string) => void,
  onOutputAudio: (base64: string) => void,
  onOutputTranscription: (text: string) => void,
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
    model: 'gemini-3.1-flash-live-preview',
    config: {
      responseModalities: [Modality.AUDIO],
      inputAudioTranscription: {},
      outputAudioTranscription: {},
      realtimeInputConfig: {
        automaticActivityDetection: {
          startOfSpeechSensitivity: StartSensitivity.START_SENSITIVITY_HIGH,
          endOfSpeechSensitivity: EndSensitivity.END_SENSITIVITY_HIGH,
          prefixPaddingMs: 0,
          silenceDurationMs: 300,
        },
      },
      systemInstruction: `You are roleplaying a scenario with the user. Stay fully in character as the other party described in the scenario.

Scenario: """${script}"""

Play the scene naturally and realistically. Keep responses short (1-3 sentences max).

During the conversation, whenever the user successfully completes one of the goals from the scenario, immediately say GOAL_DONE:[N] (where N is the goal number starting from 1) at the very start of your response, then continue naturally in character.

When the conversation ends naturally, the user says goodbye, or all goals are completed, step out of character and say exactly:
"SESSION_COMPLETE: [one sentence on overall goal achievement]. [One coaching tip on the user's communication style — mention specific filler words or habits noticed, or praise clarity if they spoke well.]"`,
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
          onOutputTranscription(msg.serverContent.outputTranscription.text)
        }

        if (msg.serverContent?.modelTurn?.parts) {
          for (const part of msg.serverContent.modelTurn.parts) {
            if (part.inlineData?.mimeType?.startsWith('audio/pcm') && part.inlineData.data) {
              onOutputAudio(part.inlineData.data)
            }
          }
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
