import { notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { scenes } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { SceneTeleprompterSession } from '@/components/teleprompter/scene-teleprompter-session'

export default async function ScenePage({
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

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <SceneTeleprompterSession script={scene.message} />
    </div>
  )
}
