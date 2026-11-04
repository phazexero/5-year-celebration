import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef } from 'react'
import type { Memory } from '../lib/content'
import { photoUrl } from '../lib/content'
import { formatDate } from '../lib/time'
import { ArrowLeft, ArrowRight, Close, MapPin } from './Icons'
import { PhotoImage } from './PhotoImage'

type Props = {
  year: number
  memories: Memory[]
  index: number | null
  onChange: (index: number | null) => void
}

export function Lightbox({ year, memories, index, onChange }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const open = index !== null
  const count = memories.length

  const go = useCallback(
    (delta: number) => {
      if (index === null || count === 0) return
      onChange((index + delta + count) % count)
    },
    [index, count, onChange],
  )

  useEffect(() => {
    if (!open) return
    lastFocus.current = document.activeElement as HTMLElement
    closeRef.current?.focus()
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevOverflow
      lastFocus.current?.focus?.()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChange(null)
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go, onChange])

  const m = index !== null ? memories[index] : null

  return (
    <AnimatePresence>
      {open && m && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={m.caption}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(25_15_12/0.82)] p-4 backdrop-blur-sm sm:p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => onChange(null)}
        >
          <button
            ref={closeRef}
            type="button"
            onClick={() => onChange(null)}
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2.5 text-white transition hover:bg-white/20"
            aria-label="Close (Esc)"
          >
            <Close size={22} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(-1)
            }}
            className="absolute left-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:left-6"
            aria-label="Previous photo"
          >
            <ArrowLeft size={24} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              go(1)
            }}
            className="absolute right-3 rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20 sm:right-6"
            aria-label="Next photo"
          >
            <ArrowRight size={24} />
          </button>

          <AnimatePresence mode="wait">
            <motion.figure
              key={index}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-md bg-white p-3 shadow-2xl sm:p-4 lg:flex-row lg:gap-6"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex min-h-0 flex-1 items-center justify-center bg-neutral-100">
                <PhotoImage
                  src={photoUrl(year, m.file)}
                  alt={m.caption}
                  label={`Photo ${index! + 1}`}
                  eager
                  className="max-h-[70vh] w-full object-contain lg:max-h-[80vh] [&:is(div)]:aspect-[4/3]"
                />
              </div>
              <figcaption className="flex shrink-0 flex-col justify-center gap-3 px-2 pt-4 pb-2 text-neutral-800 lg:w-72 lg:px-0">
                <p className="text-xs font-semibold tracking-widest uppercase opacity-60">
                  Year {year} · {index! + 1} of {count}
                </p>
                <p className="font-display text-2xl leading-snug">{m.caption}</p>
                <div className="flex flex-col gap-1 text-sm text-neutral-600">
                  {m.date && <span>{formatDate(m.date)}</span>}
                  {m.place && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={15} /> {m.place}
                    </span>
                  )}
                </div>
                <p className="mt-2 hidden text-xs text-neutral-400 lg:block">← → to browse · Esc to close</p>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
