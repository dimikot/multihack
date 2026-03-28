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
  FileText,
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
        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((scene) => (
            <div
              key={scene.id}
              className="group relative flex flex-row items-start gap-3 rounded-xl border border-accents-2 bg-background p-4 transition-shadow hover:shadow-md"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-full border border-accents-2 bg-accents-1">
                <FileText className="size-4 text-accents-4" />
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  href={`/scenes/${scene.id}`}
                  className="block text-sm font-semibold text-foreground no-underline hover:underline"
                >
                  {sceneTitle(scene.message)}
                </Link>
                <p className="mt-0.5 truncate text-xs text-accents-4">
                  {sceneSubtitle(scene.message)}
                </p>
                <p className="mt-2 text-xs text-accents-4">
                  {formatDate(scene.createdAt)}
                </p>
              </div>
              <div className="relative shrink-0">
                <button
                  className="flex size-6 items-center justify-center rounded-md text-accents-4 hover:text-foreground"
                  onClick={() =>
                    setActiveMenu(activeMenu === scene.id ? null : scene.id)
                  }
                >
                  <MoreHorizontal className="size-4" />
                </button>
                {activeMenu === scene.id && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setActiveMenu(null)}
                    />
                    <div className="absolute right-0 top-7 z-20 min-w-[120px] rounded-lg border border-accents-2 bg-background p-1 shadow-lg">
                      <Link
                        href={`/scenes/${scene.id}/edit`}
                        className="block rounded-md px-3 py-1.5 text-sm text-foreground no-underline hover:bg-accents-1"
                        onClick={() => setActiveMenu(null)}
                      >
                        Edit
                      </Link>
                      <form action={() => deleteScene(scene.id)}>
                        <button
                          type="submit"
                          className="w-full rounded-md px-3 py-1.5 text-left text-sm text-[var(--geist-error)] hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </form>
                    </div>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
