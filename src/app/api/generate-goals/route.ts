import { GoogleGenAI } from '@google/genai'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  const { scenario } = await req.json()
  if (!scenario?.trim()) return NextResponse.json({ goals: [] })

  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) return NextResponse.json({ goals: [] })

  const ai = new GoogleGenAI({ apiKey })

  const prompt = `Extract 3-5 concrete, measurable goals that the USER must achieve in this conversation scenario.
Each goal should be a short action the user needs to accomplish (not the AI's role).

Scenario: "${scenario}"

Respond with a JSON array of strings only. Example:
["Greet the agent politely", "State the desired pizza size and topping", "Confirm the delivery address", "Ask for the total price"]

Return only the JSON array, nothing else.`

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    })
    const text = response.text?.trim() ?? ''
    const match = text.match(/\[[\s\S]*\]/)
    if (!match) return NextResponse.json({ goals: [] })
    const goals = JSON.parse(match[0])
    if (!Array.isArray(goals)) return NextResponse.json({ goals: [] })
    return NextResponse.json({ goals: goals.slice(0, 5) })
  } catch {
    return NextResponse.json({ goals: [] })
  }
}
