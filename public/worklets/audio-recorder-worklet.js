class AudioRecorderWorklet extends AudioWorkletProcessor {
  constructor() {
    super()
    this.buffer = new Int16Array(512)
    this.bufferWriteIndex = 0
  }

  process(inputs) {
    if (inputs[0].length) {
      const channel0 = inputs[0][0]
      for (let i = 0; i < channel0.length; i++) {
        const int16Value = Math.max(-32768, Math.min(32767, channel0[i] * 32768))
        this.buffer[this.bufferWriteIndex++] = int16Value
        if (this.bufferWriteIndex >= this.buffer.length) {
          this.port.postMessage({
            event: 'chunk',
            data: this.buffer.slice(0, this.bufferWriteIndex).buffer,
          })
          this.bufferWriteIndex = 0
        }
      }
    }
    return true
  }
}

registerProcessor('audio-recorder-worklet', AudioRecorderWorklet)
