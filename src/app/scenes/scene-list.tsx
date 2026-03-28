'use client'

import { useState } from 'react'
import { Search, SlidersHorizontal, LayoutGrid, List, MoreHorizontal, X } from 'lucide-react'
import { SceneForm } from '@/components/scene-form'
import { createScene, updateScene, deleteScene } from './actions'
import { useRouter } from 'next/navigation'

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

function Modal({
  title,
  onClose,
  children,
}: {
  title: string
  onClose: () => void
  children: React.ReactNode
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={onClose}
    >
      <div
        className="relative flex w-full max-w-2xl flex-col rounded-2xl border border-accents-2 bg-white p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{title}</h2>
          <button
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-lg text-accents-4 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function SceneList({ scenes }: { scenes: Scene[] }) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [activeMenu, setActiveMenu] = useState<number | null>(null)
  const [showNew, setShowNew] = useState(false)
  const [editScene, setEditScene] = useState<Scene | null>(null)

  const filtered = scenes.filter((s) =>
    s.message.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8" style={{ background: 'var(--page-bg)' }}>
      {/* Top bar */}
      <div className="mb-8 flex w-full items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-accents-4" />
          <input
            placeholder="Search Scenes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-10 w-full rounded-xl border border-accents-2 bg-white pl-9 pr-3 text-sm text-foreground outline-none placeholder:text-accents-3 focus:border-accents-4"
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
        <button
          type="button"
          onClick={() => setShowNew(true)}
          className="flex h-10 items-center rounded-xl bg-foreground px-4 text-sm font-medium text-background hover:opacity-90"
        >
          Add New
        </button>
      </div>

      {/* Heading */}
      <h2 className="mb-4 text-sm font-medium text-foreground">Scenes</h2>

      {/* Cards grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-accents-4">
          {scenes.length === 0 ? 'No scenes yet.' : 'No scenes match your search.'}
        </p>
      ) : (
        <div className="grid w-full auto-rows-[280px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((scene) => (
            <div
              key={scene.id}
              onClick={() => activeMenu === null && router.push(`/scenes/${scene.id}`)}
              className="group relative flex cursor-pointer flex-col overflow-hidden rounded-xl border border-accents-2 bg-white p-5 transition-shadow hover:shadow-md"
            >
              {activeMenu === scene.id ? (
                <div
                  className="flex flex-1 flex-col items-center justify-center gap-3"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    className="w-full rounded-lg px-4 py-2.5 text-center text-sm font-medium text-foreground hover:bg-accents-1"
                    onClick={() => {
                      setActiveMenu(null)
                      setEditScene(scene)
                    }}
                  >
                    Edit
                  </button>
                  <form action={deleteScene.bind(null, scene.id)} className="w-full">
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
                        e.stopPropagation()
                        setActiveMenu(scene.id)
                      }}
                    >
                      <MoreHorizontal className="size-4" />
                    </button>
                  </div>

                  <p className="flex-1 overflow-hidden whitespace-pre-wrap text-[18px] leading-[1.6] text-accents-5">
                    {scene.message}
                  </p>

                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-white via-white/80 to-transparent" />
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {showNew && (
        <Modal title="New Scene" onClose={() => setShowNew(false)}>
          <SceneForm action={createScene} />
        </Modal>
      )}

      {editScene && (
        <Modal title="Edit Scene" onClose={() => setEditScene(null)}>
          <SceneForm
            action={updateScene.bind(null, editScene.id)}
            defaultValue={editScene.message}
          />
        </Modal>
      )}
    </div>
  )
}
