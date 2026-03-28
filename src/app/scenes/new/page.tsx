import Link from 'next/link'
import { requireAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { SceneForm } from '@/components/scene-form'
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

      <SceneForm action={createScene} />
    </main>
  )
}
