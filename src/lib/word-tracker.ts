export class WordTracker {
  private totalWords: number
  private cursorPosition = 0
  private speakerPosition = 0
  private lastSpeakerUpdate = 0
  private animationFrame: number | null = null
  private lastFrameTime = 0
  private lastReportedIndex = -1

  /** How many words ahead of speaker the cursor leads */
  private lead = 2

  onChange: ((index: number) => void) | null = null

  constructor(words: string[]) {
    this.totalWords = words.length
  }

  updateSpeakerPosition(wordIndex: number): void {
    const clamped = Math.max(0, Math.min(wordIndex, this.totalWords - 1))
    // Never go backward — speaker position only advances
    if (clamped > this.speakerPosition) {
      this.speakerPosition = clamped
      this.lastSpeakerUpdate = performance.now()
    }
  }

  private animate = (): void => {
    const now = performance.now()
    const dt = this.lastFrameTime > 0 ? (now - this.lastFrameTime) / 1000 : 0
    this.lastFrameTime = now

    if (dt > 0) {
      const target = Math.min(this.speakerPosition + this.lead, this.totalWords - 1)

      const diff = target - this.cursorPosition

      if (diff > 0) {
        // Cursor needs to advance toward target — smooth ease
        const speed = diff > 10 ? 6 : 4
        this.cursorPosition += diff * Math.min(1, speed * dt)
      }
      // Never pull cursor backward — if speaker hasn't advanced, cursor just waits
      // If diff is between -1 and 0, cursor stays (slight lead is fine)

      this.cursorPosition = Math.max(0, Math.min(this.cursorPosition, this.totalWords - 1))
    }

    const rounded = Math.round(this.cursorPosition)
    if (rounded !== this.lastReportedIndex) {
      this.lastReportedIndex = rounded
      this.onChange?.(rounded)
    }

    this.animationFrame = requestAnimationFrame(this.animate)
  }

  getCurrentIndex(): number {
    return Math.round(this.cursorPosition)
  }

  getProgress(): number {
    return this.totalWords > 1
      ? this.cursorPosition / (this.totalWords - 1)
      : 0
  }

  getAverageWPM(): number {
    // Estimate from recent speaker position changes
    return 0
  }

  start(): void {
    this.lastFrameTime = 0
    this.animate()
  }

  stop(): void {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
      this.animationFrame = null
    }
  }

  reset(): void {
    this.stop()
    this.cursorPosition = 0
    this.speakerPosition = 0
    this.lastFrameTime = 0
    this.lastReportedIndex = -1
    this.lastSpeakerUpdate = 0
  }
}
