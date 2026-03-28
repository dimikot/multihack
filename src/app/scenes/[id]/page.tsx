import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { scenes } from '@/db/schema'
import { requireAuth } from '@/lib/auth'

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
    <div className="relative min-h-screen bg-black">
      <Link
        href="/scenes"
        className="absolute left-6 top-6 text-sm text-white/40 hover:text-white/80"
      >
        ← Scenes
      </Link>
      <div className="flex min-h-screen items-center justify-center px-16 py-24">
        <p className="whitespace-pre-wrap text-center text-3xl font-medium leading-relaxed tracking-wide text-white">
          {scene.message}
        </p>
      </div>
    </div>
  )
}
