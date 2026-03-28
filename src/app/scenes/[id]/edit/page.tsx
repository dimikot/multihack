import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { scenes } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { updateScene } from '../../actions'

export default async function EditScenePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await requireAuth()
  const { id } = await params
  const sceneId = Number(id)

  const [scene] = await db
    .select()
    .from(scenes)
    .where(and(eq(scenes.id, sceneId), eq(scenes.userId, user.id)))

  if (!scene) notFound()

  const action = async (formData: FormData) => {
    'use server'
    await updateScene(sceneId, formData)
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Edit Scene</h1>
        <Link href="/scenes">
          <Button variant="ghost" size="sm">← Back</Button>
        </Link>
      </div>

      <form action={action} className="flex flex-1 flex-col gap-4">
        <textarea
          name="message"
          defaultValue={scene.message}
          className="min-h-96 flex-1 resize-none rounded-lg border border-border bg-background p-4 font-mono text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
          autoFocus
        />
        <Button type="submit" size="lg">Save Scene</Button>
      </form>
    </main>
  )
}
