import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { createScene } from '../actions'

export default async function NewScenePage() {
  await requireAuth()

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">New Scene</h1>
        <Link href="/scenes">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
      </div>

      <form action={createScene} className="flex flex-1 flex-col gap-4">
        <textarea
          name="message"
          className="min-h-96 flex-1 resize-none rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          placeholder="Write your scene text here…"
          autoFocus
        />
        <Button type="submit" size="lg">Save Scene</Button>
      </form>
    </main>
  )
}
