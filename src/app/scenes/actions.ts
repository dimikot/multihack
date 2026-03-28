'use server'

import { redirect } from 'next/navigation'
import { eq, and } from 'drizzle-orm'
import { GoogleGenAI } from '@google/genai'
import { db } from '@/db'
import { scenes } from '@/db/schema'
import { requireAuth } from '@/lib/auth'

async function generateGoals(scenario: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) { console.error('[generateGoals] No GEMINI_API_KEY'); return '[]' }
  try {
    const ai = new GoogleGenAI({ apiKey })
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Extract 3-5 concrete, measurable goals that the USER must achieve in this conversation scenario.
Each goal should be a short action the user needs to accomplish (not the AI's role).

Scenario: "${scenario}"

Respond with a JSON array of strings only. Example:
["Greet the agent politely", "State the desired pizza size and topping", "Confirm the delivery address"]

Return only the JSON array, nothing else.`,
    })
    const text = response.text?.trim() ?? ''
    console.log('[generateGoals] response:', text.slice(0, 200))
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return '[]'
    const parsed = JSON.parse(match[0])
    return Array.isArray(parsed) ? JSON.stringify(parsed.slice(0, 5)) : '[]'
  } catch (e) {
    console.error('[generateGoals] error:', e)
    return '[]'
  }
}

export async function createScene(formData: FormData) {
  const user = await requireAuth()
  const message = String(formData.get('message') ?? '').trim()
  if (!message) return

  const goals = await generateGoals(message)

  await db.insert(scenes).values({ userId: user.id, message, goals })

  redirect('/scenes')
}

export async function updateScene(id: number, formData: FormData) {
  const user = await requireAuth()
  const message = String(formData.get('message') ?? '').trim()
  if (!message) return

  const goals = await generateGoals(message)

  await db
    .update(scenes)
    .set({ message, goals })
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
