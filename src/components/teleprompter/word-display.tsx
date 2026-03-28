'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface WordDisplayProps {
  words: string[]
  currentIndex: number
  progress: number
  fontSize?: number
  onWordClick?: (index: number) => void
}

export function WordDisplay({ words, currentIndex, progress, fontSize = 72, onWordClick }: WordDisplayProps) {
  const currentWordRef = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    currentWordRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }, [currentIndex])

  if (words.length === 0) {
    return (
      <div className="relative flex h-[calc(100vh-64px)] items-center justify-center bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
        <p className="text-xl text-zinc-500">No words to display</p>
      </div>
    )
  }

  return (
    <div className="relative h-[calc(100vh-64px)] overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950">
      <div
        className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500"
        style={{ width: `${Math.min(Math.max(progress, 0), 100)}%` }}
      />

      <div className="pointer-events-none absolute top-0 right-0 left-0 z-10 h-20 bg-gradient-to-b from-zinc-950 to-transparent" />
      <div className="pointer-events-none absolute right-0 bottom-0 left-0 z-10 h-20 bg-gradient-to-t from-zinc-950 to-transparent" />

      <div className="h-full overflow-y-auto px-8 py-24 md:px-16 lg:px-24">
        <p className="mx-auto max-w-4xl leading-relaxed" style={{ fontSize: `${fontSize}px` }}>
          {words.map((word, index) => {
            const isCurrent = index === currentIndex
            const isSpoken = index < currentIndex

            return (
              <span
                key={index}
                ref={isCurrent ? currentWordRef : undefined}
                onClick={() => onWordClick?.(index)}
                className={cn(
                  'inline-block px-1 py-0.5 transition-all duration-300',
                  isSpoken && 'text-zinc-600',
                  !isSpoken && 'text-zinc-400',
                  onWordClick && 'cursor-pointer hover:opacity-80'
                )}
              >
                {word}{' '}
              </span>
            )
          })}
        </p>
      </div>
    </div>
  )
}
