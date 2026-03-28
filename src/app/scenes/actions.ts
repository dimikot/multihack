'use server'

import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { db } from '@/db'
import { scenes } from '@/db/schema'
import { requireAuth } from '@/lib/auth'

export async function createScene(formData: FormData) {
  const user = await requireAuth()
  const message = String(formData.get('message') ?? '').trim()
  if (!message) return

  const [scene] = await db
    .insert(scenes)
    .values({ userId: user.id, message })
    .returning({ id: scenes.id })

  redirect('/scenes')
}

export async function updateScene(id: number, formData: FormData) {
  const user = await requireAuth()
  const message = String(formData.get('message') ?? '').trim()
  if (!message) return

  await db
    .update(scenes)
    .set({ message })
    .where(and(eq(scenes.id, id), eq(scenes.userId, user.id)))

  redirect('/scenes')
}

export async function deleteScene(id: number) {
  const user = await requireAuth()
  await db
    .delete(scenes)
    .where(and(eq(scenes.id, id), eq(scenes.userId, user.id)))
  redirect('/scenes')
}
