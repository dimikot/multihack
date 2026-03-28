import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { scenes } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { SceneList } from './scene-list'

export default async function ScenesPage() {
  const user = await requireAuth()
  const rows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.userId, user.id))
    .orderBy(desc(scenes.createdAt))

  return (
    <SceneList
      scenes={rows.map((r) => ({
        id: r.id,
        message: r.message,
        createdAt: r.createdAt,
      }))}
    />
  )
}
