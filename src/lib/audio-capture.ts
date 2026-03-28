export class AudioCapture {
  onData: ((data: string) => void) | null = null
  onVolume: ((level: number) => void) | null = null

  private context: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private workletNode: AudioWorkletNode | null = null
  private paused = false

  async start(): Promise<void> {
    this.context = new AudioContext({ sampleRate: 16000 })
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })

    await this.context.audioWorklet.addModule('/worklets/audio-recorder-worklet.js')

    this.source = this.context.createMediaStreamSource(this.stream)
    this.workletNode = new AudioWorkletNode(this.context, 'audio-recorder-processor')

    this.workletNode.port.onmessage = (event: MessageEvent) => {
      if (this.paused) return

      const { type } = event.data
      if (type === 'data') {
        const int16: Int16Array = event.data.buffer
        const base64 = this.int16ToBase64(int16)
        this.onData?.(base64)
      } else if (type === 'volume') {
        this.onVolume?.(event.data.level)
      }
    }

    this.source.connect(this.workletNode)
    this.workletNode.connect(this.context.destination)
    this.paused = false
  }

  async stop(): Promise<void> {
    this.workletNode?.disconnect()
    this.source?.disconnect()
    this.stream?.getTracks().forEach((t) => t.stop())
    await this.context?.close()

    this.workletNode = null
    this.source = null
    this.stream = null
    this.context = null
    this.paused = false
  }

  pause(): void {
    this.paused = true
  }

  resume(): void {
    this.paused = false
  }

  // Encode Int16Array bytes as base64 using the raw underlying ArrayBuffer
  private int16ToBase64(int16: Int16Array): string {
    const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}
