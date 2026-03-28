import Link from 'next/link'
import { notFound } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { ArrowLeft } from 'lucide-react'
import { GoogleGenAI } from '@google/genai'
import { db } from '@/db'
import { scenes } from '@/db/schema'
import { requireAuth } from '@/lib/auth'
import { SceneConversationSession } from '@/components/teleprompter/scene-conversation-session'

async function getOrGenerateGoals(sceneId: number, message: string, storedGoals: string): Promise<string[]> {
  try {
    const parsed = JSON.parse(storedGoals)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch { /* fall through */ }

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return []

  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Extract 3-5 concrete goals the USER must achieve in this scenario. Short action phrases only.
Scenario: "${message}"
Return only a JSON array of strings.`,
    })
    const text = response.text?.trim() ?? ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return []
    const goals = JSON.parse(match[0])
    if (!Array.isArray(goals)) return []

    const goalsJson = JSON.stringify(goals.slice(0, 5))
    await db.update(scenes).set({ goals: goalsJson }).where(eq(scenes.id, sceneId))
    return goals.slice(0, 5)
  } catch {
    return []
  }
}

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

  const goals = await getOrGenerateGoals(sceneId, scene.message, scene.goals ?? '[]')

  return (
    <div className="relative min-h-screen bg-zinc-950 text-zinc-100">
      <Link
        href="/scenes"
        className="absolute left-4 top-4 z-50 flex size-10 items-center justify-center rounded-full bg-white/10 text-zinc-300 backdrop-blur-sm transition-colors hover:bg-white/20 hover:text-white"
      >
        <ArrowLeft className="size-5" />
      </Link>
      <SceneConversationSession script={scene.message} goals={goals} />
    </div>
  )
}
