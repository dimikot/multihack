"use client"

import { useState } from "react"
import { Sparkles, Loader2 } from "lucide-react"

interface ScriptEditorProps {
  onStart: (script: string) => void
}

export function ScriptEditor({ onStart }: ScriptEditorProps) {
  const [script, setScript] = useState("")
  const [generating, setGenerating] = useState(false)

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0

  const generateRandomScript = async () => {
    setGenerating(true)
    try {
      const res = await fetch("/api/generate-script", { method: "POST" })
      const { text } = await res.json()
      if (text) setScript(text)
    } catch {
      // silently fail
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-4 py-12">
      <h1 className="mb-8 text-center text-3xl font-bold tracking-tight text-zinc-100">
        Text Coach
      </h1>

      <div className="space-y-4">
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          placeholder="Paste or type your script here..."
          rows={10}
          className="w-full resize-y rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-3 text-zinc-100 placeholder-zinc-500 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
        />

        <div className="flex items-center justify-between">
          <button
            onClick={generateRandomScript}
            disabled={generating}
            className="flex items-center gap-2 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 disabled:opacity-50"
          >
            {generating ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            Generate random script
          </button>

          <span className="text-sm text-zinc-400">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </div>

        <button
          onClick={() => onStart(script)}
          disabled={wordCount === 0}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Reading
        </button>
      </div>
    </div>
  )
}
