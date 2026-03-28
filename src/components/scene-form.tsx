'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

interface SceneFormProps {
  action: (formData: FormData) => Promise<void>
  defaultValue?: string
}

export function SceneForm({ action, defaultValue = '' }: SceneFormProps) {
  const [message, setMessage] = useState(defaultValue)

  return (
    <form action={action} className="flex flex-1 flex-col gap-4">
      <textarea
        name="message"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        className="min-h-64 flex-1 resize-none rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
        placeholder="Describe the scenario. Example: You are a pizza place worker. The user wants to order a large pepperoni pizza for delivery."
        autoFocus
      />
      <div className="flex justify-end">
        <Button type="submit" size="lg" disabled={!message.trim()}>
          Save Scene
        </Button>
      </div>
    </form>
  )
}
