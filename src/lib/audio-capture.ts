export class AudioCapture {
  onData: ((data: string) => void) | null = null
  onVolume: ((level: number) => void) | null = null

  private context: AudioContext | null = null
  private stream: MediaStream | null = null
  private source: MediaStreamAudioSourceNode | null = null
  private workletNode: AudioWorkletNode | null = null
  private paused = false

  async start(): Promise<void> {
    console.log('[AUDIO] Requesting microphone...')
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    })
    console.log('[AUDIO] Microphone granted')

    this.context = new AudioContext({ sampleRate: 16000 })
    if (this.context.state === 'suspended') {
      await this.context.resume()
    }
    console.log('[AUDIO] AudioContext state:', this.context.state, 'rate:', this.context.sampleRate)

    await this.context.audioWorklet.addModule('/worklets/audio-recorder-worklet.js')

    this.source = this.context.createMediaStreamSource(this.stream)
    this.workletNode = new AudioWorkletNode(this.context, 'audio-recorder-worklet')

    const silentSink = this.context.createGain()
    silentSink.gain.value = 0

    let chunkCount = 0
    this.workletNode.port.onmessage = (event: MessageEvent) => {
      if (this.paused) return
      if (event.data.event !== 'chunk') return

      const int16 = new Int16Array(event.data.data)
      chunkCount++

      const rms = this.computeRMS(int16)
      this.onVolume?.(Math.min(1, rms * 5))

      if (chunkCount <= 3 || chunkCount % 50 === 0) {
        console.log(`[AUDIO] Chunk #${chunkCount}, rms=${rms.toFixed(4)}`)
      }

      const base64 = this.int16ToBase64(int16)
      this.onData?.(base64)
    }

    this.source.connect(this.workletNode)
    this.workletNode.connect(silentSink)
    silentSink.connect(this.context.destination)
    this.paused = false
    console.log('[AUDIO] Pipeline connected and running')
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

  private computeRMS(int16: Int16Array): number {
    let sum = 0
    for (let i = 0; i < int16.length; i++) {
      const sample = int16[i] / 32768
      sum += sample * sample
    }
    return Math.sqrt(sum / int16.length)
  }

  private int16ToBase64(int16: Int16Array): string {
    const bytes = new Uint8Array(int16.buffer, int16.byteOffset, int16.byteLength)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
  }
}
