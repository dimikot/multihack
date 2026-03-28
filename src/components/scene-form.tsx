'use client'

import { useState } from 'react'
import { Sparkles, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SceneFormProps {
  action: (formData: FormData) => Promise<void>
  defaultValue?: string
}

export function SceneForm({ action, defaultValue = '' }: SceneFormProps) {
  const [message, setMessage] = useState(defaultValue)
  const [generating, setGenerating] = useState(false)

  const generate = async () => {
    setGenerating(true)
    try {
      const res = await fetch('/api/generate-script', { method: 'POST' })
      const { text } = await res.json()
      if (text) setMessage(text)
    } catch {
      // silently fail
    } finally {
      setGenerating(false)
    }
  }

  return (
    <form action={action} className="flex flex-1 flex-col gap-4">
      <textarea
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="min-h-96 flex-1 resize-none rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        placeholder="Describe the scenario and goal. Example: You are a pizza place worker. Goal: the user must successfully order a large pepperoni pizza for delivery."
        autoFocus
      />
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={generate}
          disabled={generating}
          className="flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground disabled:opacity-50"
        >
          {generating ? (
            <Loader2 className="size-4 animate-spin" />
          ) : (
            <Sparkles className="size-4" />
          )}
          Generate random script
        </button>
        <Button type="submit" size="lg">Save Scene</Button>
      </div>
    </form>
  )
}
