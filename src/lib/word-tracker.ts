export class WordTracker {
  private words: string[]
  private confirmedIndex = 0
  private interpolatedIndex = 0
  private targetIndex = 0
  private lastUpdateTime = 0
  private averageWPM = 0
  private recentPositions: { index: number; time: number }[] = []
  private animationFrame: number | null = null
  private lastAnimationTime = 0
  private lastReportedIndex = -1

  onChange: ((index: number) => void) | null = null

  constructor(words: string[]) {
    this.words = words
  }

  updatePosition(wordIndex: number): void {
    const now = performance.now()
    const clamped = Math.max(0, Math.min(wordIndex, this.words.length - 1))

    this.recentPositions.push({ index: clamped, time: now })
    if (this.recentPositions.length > 10) {
      this.recentPositions.shift()
    }

    this.confirmedIndex = clamped
    this.targetIndex = clamped
    this.lastUpdateTime = now

    const jump = Math.abs(clamped - this.interpolatedIndex)
    if (jump > 5) {
      this.interpolatedIndex = clamped
      this.emitChange()
    }

    this.calculateWPM()
  }

  private calculateWPM(): void {
    const positions = this.recentPositions
    if (positions.length < 2) return

    const first = positions[0]
    const last = positions[positions.length - 1]
    const elapsedMinutes = (last.time - first.time) / 60_000

    if (elapsedMinutes <= 0) return

    const wordsSpoken = Math.abs(last.index - first.index)
    this.averageWPM = wordsSpoken / elapsedMinutes
  }

  // Interpolates toward targetIndex with ease-out, extrapolates between updates using WPM
  private animate = (): void => {
    const now = performance.now()
    const dt = this.lastAnimationTime > 0 ? (now - this.lastAnimationTime) / 1000 : 0
    this.lastAnimationTime = now

    const diff = this.targetIndex - this.interpolatedIndex

    if (Math.abs(diff) > 0.01) {
      const easeSpeed = 8
      this.interpolatedIndex += diff * Math.min(1, easeSpeed * dt)
    } else if (this.averageWPM > 0 && this.lastUpdateTime > 0) {
      const timeSinceUpdate = (now - this.lastUpdateTime) / 60_000
      const extrapolated = this.confirmedIndex + this.averageWPM * timeSinceUpdate
      const maxExtrapolation = this.confirmedIndex + 3
      const clampedTarget = Math.min(
        extrapolated,
        maxExtrapolation,
        this.words.length - 1
      )

      if (clampedTarget > this.interpolatedIndex) {
        const extraDiff = clampedTarget - this.interpolatedIndex
        this.interpolatedIndex += extraDiff * Math.min(1, 4 * dt)
      }
    }

    this.interpolatedIndex = Math.max(
      0,
      Math.min(this.interpolatedIndex, this.words.length - 1)
    )

    this.emitChange()
    this.animationFrame = requestAnimationFrame(this.animate)
  }

  private emitChange(): void {
    const rounded = Math.round(this.interpolatedIndex)
    if (rounded !== this.lastReportedIndex) {
      this.lastReportedIndex = rounded
      this.onChange?.(rounded)
    }
  }

  getCurrentIndex(): number {
    return Math.round(this.interpolatedIndex)
  }

  getProgress(): number {
    return this.words.length > 0
      ? this.interpolatedIndex / (this.words.length - 1)
      : 0
  }

  getAverageWPM(): number {
    return Math.round(this.averageWPM)
  }

  start(): void {
    this.lastAnimationTime = 0
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
    this.confirmedIndex = 0
    this.interpolatedIndex = 0
    this.targetIndex = 0
    this.recentPositions = []
    this.averageWPM = 0
    this.lastUpdateTime = 0
    this.lastAnimationTime = 0
    this.lastReportedIndex = -1
  }
}
