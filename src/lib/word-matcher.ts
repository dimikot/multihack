function normalize(w: string): string {
  return w.toLowerCase().replace(/[^\p{L}\p{N}]/gu, '')
}

function levenshtein(a: string, b: string): number {
  if (a.length === 0) return b.length
  if (b.length === 0) return a.length
  const matrix: number[][] = []
  for (let i = 0; i <= b.length; i++) matrix[i] = [i]
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = b[i - 1] === a[j - 1] ? 0 : 1
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost,
      )
    }
  }
  return matrix[b.length][a.length]
}

function fuzzyMatch(spoken: string, script: string): boolean {
  if (spoken === script) return true
  if (spoken.length < 3 || script.length < 3) return spoken === script
  if (script.startsWith(spoken) || spoken.startsWith(script)) return true
  const maxLen = Math.max(spoken.length, script.length)
  const dist = levenshtein(spoken, script)
  return dist / maxLen <= 0.5
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

      const fwdEnd = Math.min(this.position + 15, this.scriptNorm.length)
      const window = this.scriptNorm.slice(this.position, fwdEnd)
      console.log(`[MATCHER] "${spoken}" vs script[${this.position}..${fwdEnd - 1}]:`, window.join(', '))

      let found = false
      for (let i = this.position; i < fwdEnd; i++) {
        if (fuzzyMatch(spoken, this.scriptNorm[i])) {
          const jump = i - this.position
          if (jump > 3) {
            console.log(`[MATCHER] SKIP "${spoken}" ~ "${this.scriptNorm[i]}" at ${i} (jump=${jump} > 3)`)
            continue
          }
          console.log(`[MATCHER] MATCH "${spoken}" ~ "${this.scriptNorm[i]}" at ${i}`)
          this.position = i + 1
          moved = true
          found = true
          break
        }
      }
      if (found) continue

      const bwdStart = Math.max(0, this.position - 15)
      for (let i = this.position - 1; i >= bwdStart; i--) {
        if (fuzzyMatch(spoken, this.scriptNorm[i])) {
          this.position = i + 1
          moved = true
          break
        }
      }
    }

    return moved ? this.position - 1 : null
  }

  correctPosition(index: number) {
    if (index + 1 > this.position) {
      this.position = index + 1
    }
  }

  setPosition(index: number) {
    this.position = index
    this.buffer = ''
  }

  getPosition() {
    return Math.max(0, this.position - 1)
  }
}
