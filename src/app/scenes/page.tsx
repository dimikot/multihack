import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { scenes } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { deleteScene } from './actions'

export default async function ScenesPage() {
  const user = await requireAuth()
  const rows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.userId, user.id))
    .orderBy(desc(scenes.createdAt))

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Scenes</h1>
        <Link href="/">
          <Button variant="ghost" size="sm">← Home</Button>
        </Link>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        {rows.length === 0 && (
          <p className="text-muted-foreground">No scenes yet. Add one below.</p>
        )}
        {rows.map((scene) => (
          <div
            key={scene.id}
            className="flex items-center gap-3 rounded-lg border border-border p-4"
          >
            <Link
              href={`/scenes/${scene.id}`}
              className="flex-1 truncate text-sm text-foreground hover:underline"
            >
              {scene.message.slice(0, 120)}
              {scene.message.length > 120 ? '…' : ''}
            </Link>
            <Link href={`/scenes/${scene.id}/edit`}>
              <Button variant="outline" size="sm">Edit</Button>
            </Link>
            <form
              action={async () => {
                'use server'
                await deleteScene(scene.id)
              }}
            >
              <Button variant="destructive" size="sm" type="submit">Delete</Button>
            </form>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <Link href="/scenes/new">
          <Button size="lg">+ Add Scene</Button>
        </Link>
      </div>
    </main>
  )
}
