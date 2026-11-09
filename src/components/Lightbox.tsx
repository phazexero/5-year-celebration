import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { deleteUpload, updateUpload, type GalleryItem } from '../lib/gallery'
import { formatDate } from '../lib/time'
import { GalleryPhoto } from './GalleryPhoto'
import { ArrowLeft, ArrowRight, Close, MapPin } from './Icons'

type Props = {
  year: number
  items: GalleryItem[]
  index: number | null
  onChange: (index: number | null) => void
}

const typing = (e: KeyboardEvent) => {
  const t = e.target as HTMLElement | null
  return !!t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)
}

function UploadTools({ item, onDeleted }: { item: GalleryItem; onDeleted: () => void }) {
  const [mode, setMode] = useState<'view' | 'edit' | 'delete'>('view')
  const [caption, setCaption] = useState(item.caption)
  const [date, setDate] = useState(item.date)
  const [place, setPlace] = useState(item.place)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const id = item.upload!.id

  useEffect(() => {
    setMode('view')
    setCaption(item.caption)
    setDate(item.date)
    setPlace(item.place)
    setError('')
  }, [item.key]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn: () => Promise<void>, after: () => void) => {
    setBusy(true)
    setError('')
    try {
      await fn()
      after()
    } catch (e) {
      setError((e as Error).message || 'That didn’t work. Try again?')
    } finally {
      setBusy(false)
    }
  }

  if (mode === 'edit') {
    return (
      <form
        className="flex flex-col gap-2 text-sm"
        onSubmit={(e) => {
          e.preventDefault()
          run(() => updateUpload(item.year, id, { caption, date, place }), () => setMode('view'))
        }}
      >
        <label className="font-semibold" htmlFor="lb-caption">
          Caption
        </label>
        <textarea
          id="lb-caption"
          value={caption}
          maxLength={300}
          rows={3}
          onChange={(e) => setCaption(e.target.value)}
          className="rounded-lg border border-black/15 px-3 py-2"
        />
        <label className="font-semibold" htmlFor="lb-date">
          Date
        </label>
        <input id="lb-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2" />
        <label className="font-semibold" htmlFor="lb-place">
          Place
        </label>
        <input id="lb-place" value={place} maxLength={120} onChange={(e) => setPlace(e.target.value)} className="rounded-lg border border-black/15 px-3 py-2" />
        <div className="mt-2 flex gap-2">
          <button type="submit" className="btn px-4 py-1.5 text-sm" disabled={busy}>
            {busy ? 'Saving…' : 'Save'}
          </button>
          <button type="button" className="btn btn-ghost px-4 py-1.5 text-sm" onClick={() => setMode('view')}>
            Cancel
          </button>
        </div>
        {error && <p className="text-xs text-red-700">{error}</p>}
      </form>
    )
  }
  if (mode === 'delete') {
    return (
      <div className="flex flex-col gap-2 text-sm">
        <p>Delete this photo for both of you?</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn bg-red-700 px-4 py-1.5 text-sm"
            disabled={busy}
            onClick={() => run(() => deleteUpload(item.year, id), onDeleted)}
          >
            {busy ? 'Deleting…' : 'Delete'}
          </button>
          <button type="button" className="btn btn-ghost px-4 py-1.5 text-sm" onClick={() => setMode('view')}>
            Keep it
          </button>
        </div>
        {error && <p className="text-xs text-red-700">{error}</p>}
      </div>
    )
  }
  return (
    <div className="flex gap-2 text-sm">
      <button type="button" className="btn btn-ghost px-4 py-1.5 text-sm" onClick={() => setMode('edit')}>
        Edit details
      </button>
      <button type="button" className="rounded-full px-3 py-1.5 text-sm text-neutral-500 hover:bg-black/5 hover:text-red-700" onClick={() => setMode('delete')}>
        Delete
      </button>
    </div>
  )
}

export function Lightbox({ year, items, index, onChange }: Props) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const lastFocus = useRef<HTMLElement | null>(null)
  const open = index !== null && index < items.length
  const count = items.length

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
      else if (typing(e)) return
      else if (e.key === 'ArrowRight') go(1)
      else if (e.key === 'ArrowLeft') go(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, go, onChange])

  const m = open ? items[index!] : null

  return (
    <AnimatePresence>
      {open && m && (
        <motion.div
          key="lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={m.caption || 'Photo'}
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
          {count > 1 && (
            <>
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
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.figure
              key={m.key}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-full w-full max-w-5xl flex-col overflow-hidden rounded-md bg-white p-3 shadow-2xl sm:p-4 lg:flex-row lg:gap-6"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              <div className="flex min-h-0 flex-1 items-center justify-center bg-neutral-100">
                <GalleryPhoto
                  source={m.source}
                  alt={m.caption}
                  label={`Photo ${index! + 1}`}
                  eager
                  className="max-h-[70vh] w-full object-contain lg:max-h-[80vh] [&:is(div)]:aspect-[4/3]"
                />
              </div>
              <figcaption className="flex shrink-0 flex-col justify-center gap-3 overflow-y-auto px-2 pt-4 pb-2 text-neutral-800 lg:w-72 lg:px-0">
                <p className="text-xs font-semibold tracking-widest uppercase opacity-60">
                  Year {year} · {index! + 1} of {count}
                </p>
                {m.caption && <p className="font-display text-2xl leading-snug">{m.caption}</p>}
                <div className="flex flex-col gap-1 text-sm text-neutral-600">
                  {m.date && <span>{formatDate(m.date)}</span>}
                  {m.place && (
                    <span className="inline-flex items-center gap-1.5">
                      <MapPin size={15} /> {m.place}
                    </span>
                  )}
                </div>
                {m.upload && (
                  <div className="mt-2 border-t border-black/5 pt-3">
                    <UploadTools
                      item={m}
                      onDeleted={() => (count <= 1 ? onChange(null) : onChange(Math.min(index!, count - 2)))}
                    />
                  </div>
                )}
                <p className="mt-2 hidden text-xs text-neutral-400 lg:block">← → to browse · Esc to close</p>
              </figcaption>
            </motion.figure>
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
