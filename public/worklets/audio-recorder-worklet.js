class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super()
    this._buffer = new Int16Array(4096)
    this._offset = 0
  }

  process(inputs) {
    const input = inputs[0]
    if (!input || !input[0]) return true

    const samples = input[0]
    let sumSquares = 0

    for (let i = 0; i < samples.length; i++) {
      const s = samples[i]
      sumSquares += s * s

      const pcm = Math.max(-32768, Math.min(32767, Math.round(s * 0x7fff)))
      this._buffer[this._offset++] = pcm

      if (this._offset >= 4096) {
        this.port.postMessage({ type: 'data', buffer: this._buffer.slice() })
        this._offset = 0
      }
    }

    const rms = Math.sqrt(sumSquares / samples.length)
    this.port.postMessage({ type: 'volume', level: Math.min(1, rms) })

    return true
  }
}

registerProcessor('audio-recorder-processor', AudioRecorderProcessor)
