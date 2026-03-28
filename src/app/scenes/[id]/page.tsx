import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { ArrowLeft } from 'lucide-react'
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
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <Link
        href="/scenes"
        className="absolute left-4 top-4 z-50 flex size-10 items-center justify-center rounded-full bg-white/10 text-zinc-300 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <SceneTeleprompterSession script={scene.message} />
    </div>
  )
}
