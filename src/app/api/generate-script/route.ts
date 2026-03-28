import { GoogleGenAI } from '@google/genai'
import { NextResponse } from 'next/server'

export async function POST() {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
  }

  const ai = new GoogleGenAI({ apiKey })

  const topics = [
    'the future of space exploration',
    'how artificial intelligence is changing education',
    'the art of public speaking',
    'sustainable energy and climate change',
    'the history of the internet',
    'why curiosity is humanity\'s greatest trait',
    'the science behind a good night\'s sleep',
    'how music affects the human brain',
    'the evolution of social media',
    'why storytelling matters in business',
  ]

  const topic = topics[Math.floor(Math.random() * topics.length)]

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Write a 150-200 word speech script about "${topic}".
Write only the speech text, no titles, no stage directions, no formatting.
Just the words the speaker would say. Make it engaging and natural-sounding.`,
  })

  const text = response.text?.trim() ?? ''

  return NextResponse.json({ text })
}
