function normalize(w: string): string {
  return w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

export class WordMatcher {
  private scriptNorm: string[]
  private position = 0
  private buffer = ''

  constructor(scriptWords: string[]) {
    this.scriptNorm = scriptWords.map(normalize)
  }

  addChunk(chunk: string): number | null {
    this.buffer += chunk

    const hasTrailingSpace = /\s$/.test(this.buffer)
    const tokens = this.buffer.split(/\s+/).filter(Boolean)

    if (tokens.length === 0) return null

    const complete = hasTrailingSpace ? tokens : tokens.slice(0, -1)
    this.buffer = hasTrailingSpace ? '' : tokens[tokens.length - 1]

    if (complete.length === 0) return null

    let moved = false
    for (const raw of complete) {
      const spoken = normalize(raw)
      if (!spoken || spoken.length < 2) continue

      // Search forward (normal reading)
      const fwdEnd = Math.min(this.position + 8, this.scriptNorm.length)
      let found = false
      for (let i = this.position; i < fwdEnd; i++) {
        if (this.scriptNorm[i] === spoken) {
          this.position = i + 1
          moved = true
          found = true
          break
        }
      }
      if (found) continue

      // Search backward (speaker went back in script)
      const bwdStart = Math.max(0, this.position - 15)
      for (let i = this.position - 1; i >= bwdStart; i--) {
        if (this.scriptNorm[i] === spoken) {
          this.position = i + 1
          moved = true
          break
        }
      }
      // If no match at all — it's a filler/off-script word, just ignore it
    }

    return moved ? this.position - 1 : null
  }

  correctPosition(index: number) {
    if (index + 1 > this.position) {
      this.position = index + 1
    }
  }

  getPosition() {
    return Math.max(0, this.position - 1)
  }
}
