import type { Metadata } from "next"
import { TeleprompterSession } from "@/components/teleprompter/teleprompter-session"

export const metadata: Metadata = {
  title: "Text",
  description: "AI-powered speech coaching teleprompter",
}

export default function TeleprompterPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <TeleprompterSession />
    </div>
  )
}
