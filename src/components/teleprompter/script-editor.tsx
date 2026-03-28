"use client"

import { useState } from "react"
import { SUPPORTED_LANGUAGES, type LanguageCode } from "@/lib/types"

interface ScriptEditorProps {
  onStart: (script: string, language: string) => void
}

export function ScriptEditor({ onStart }: ScriptEditorProps) {
  const [script, setScript] = useState("")
  const [language, setLanguage] = useState<LanguageCode>("en")

  const wordCount = script.trim() ? script.trim().split(/\s+/).length : 0

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
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as LanguageCode)}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 outline-none transition-colors focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
          >
            {SUPPORTED_LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>

          <span className="text-sm text-zinc-400">
            {wordCount} {wordCount === 1 ? "word" : "words"}
          </span>
        </div>

        <button
          onClick={() => onStart(script, language)}
          disabled={wordCount === 0}
          className="w-full rounded-lg bg-blue-600 px-6 py-3 text-lg font-semibold text-white transition-colors hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Start Reading
        </button>
      </div>
    </div>
  )
}
