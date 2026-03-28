'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  ChevronDown,
  MoreHorizontal,
} from 'lucide-react'
import { deleteScene } from './actions'

interface Scene {
  id: number
  message: string
  createdAt: Date
}

function formatDate(date: Date) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'numeric',
    day: 'numeric',
    year: '2-digit',
  }).format(new Date(date))
}

function sceneTitle(message: string) {
  const firstLine = message.split('\n')[0].trim()
  return firstLine.length > 40 ? firstLine.slice(0, 40) + '...' : firstLine
}

function sceneSubtitle(message: string) {
  const words = message.replace(/\n/g, ' ').trim()
  return words.length > 60 ? words.slice(0, 60) + '...' : words
}

export function SceneList({ scenes }: { scenes: Scene[] }) {
  const [query, setQuery] = useState('')
  const [activeMenu, setActiveMenu] = useState<number | null>(null)

  const filtered = scenes.filter((s) =>
    s.message.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
      {/* Top bar */}
      <div className="mb-8 flex w-full items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accents-4" />
          <input
            placeholder="Search Scenes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-accents-2 bg-background pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-accents-3 focus:border-accents-4"
          />
        </div>
        <button className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-accents-2 text-accents-5 hover:border-accents-4">
          <SlidersHorizontal className="size-4" />
        </button>
        <div className="flex overflow-hidden rounded-xl border border-accents-2">
          <button className="flex size-10 items-center justify-center border-r border-accents-2 bg-accents-1 text-foreground">
            <LayoutGrid className="size-4" />
          </button>
          <button className="flex size-10 items-center justify-center text-accents-4 hover:text-foreground">
            <List className="size-4" />
          </button>
        </div>
        <Link href="/scenes/new">
          <button className="flex h-10 items-center gap-1.5 rounded-xl bg-foreground px-4 text-sm font-medium text-background hover:opacity-90">
            Add New...
            <ChevronDown className="size-3.5" />
          </button>
        </Link>
      </div>

      {/* Heading */}
      <h2 className="mb-4 text-sm font-medium text-foreground">Scenes</h2>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-accents-4">
          {scenes.length === 0
            ? 'No scenes yet.'
            : 'No scenes match your search.'}
        </p>
      ) : (
        <div className="grid w-full auto-rows-[280px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((scene) => (
            <Link
              key={scene.id}
              href={`/scenes/${scene.id}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-accents-2 bg-background p-5 no-underline transition-shadow hover:shadow-md"
            >
              {activeMenu === scene.id ? (
                <div
                  className="flex flex-1 flex-col items-center justify-center gap-3"
                  onClick={(e) => e.preventDefault()}
                >
                  <Link
                    href={`/scenes/${scene.id}/edit`}
                    className="w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium text-foreground no-underline hover:bg-accents-1"
                    onClick={() => setActiveMenu(null)}
                  >
                    Edit
                  </Link>
                  <form action={() => deleteScene(scene.id)} className="w-full">
                    <button
                      type="submit"
                      className="w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium text-[var(--geist-error)] hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </form>
                  <button
                    className="w-full rounded-lg px-4 py-2.5 text-center text-sm text-accents-4 hover:bg-accents-1"
                    onClick={() => setActiveMenu(null)}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex items-center justify-between px-5 py-3 opacity-0 transition-opacity group-hover:opacity-100">
                    <span className="text-xs text-accents-4">
                      {formatDate(scene.createdAt)}
                    </span>
                    <button
                      className="pointer-events-auto flex size-6 items-center justify-center rounded-md text-accents-4 hover:text-foreground"
                      onClick={(e) => {
                        e.preventDefault()
                        setActiveMenu(scene.id)
                      }}
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>

                  <p className="flex-1 overflow-hidden whitespace-pre-wrap text-[18px] leading-[1.6] text-accents-5">
                    {scene.message}
                  </p>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background via-background/80 to-transparent" />
                </>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
