import Link from 'next/link'
import { desc, eq } from 'drizzle-orm'
import { db } from '@/db'
import { scenes } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { signOut } from '@/app/actions'
import { Button } from '@/components/ui/button'
import { SceneList } from './scene-list'

export default async function ScenesPage() {
  const user = await requireAuth()
  const rows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.userId, user.id))
    .orderBy(desc(scenes.createdAt))

  return (
    <div className="flex min-h-screen flex-col" style={{ background: 'var(--page-bg)' }}>
      <header className="shrink-0 border-b border-accents-2 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6">
          <Link
            href="/scenes"
            className="text-lg font-semibold text-foreground no-underline"
          >
            TeleWatch
          </Link>
          <form action={signOut}>
            <Button variant="outline" size="sm" type="submit">
              Log out
            </Button>
          </form>
        </div>
      </header>
      <SceneList
        scenes={rows.map((r) => ({
          id: r.id,
          message: r.message,
          createdAt: r.createdAt,
        }))}
      />
    </div>
  )
}
