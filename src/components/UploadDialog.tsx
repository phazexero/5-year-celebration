import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { fileDate, friendlyError, uploadPhoto } from '../lib/gallery'
import { Close } from './Icons'

type Row = {
  key: string
  file: File
  preview: string
  caption: string
  date: string
  place: string
  status: 'ready' | 'uploading' | 'done' | 'error'
  error?: string
}

const MAX_FILES = 20

/** pick photos, add a caption, date and place to each, and upload them to one year */
export function UploadDialog({ year, open, onClose }: { year: number; open: boolean; onClose: () => void }) {
  const [rows, setRows] = useState<Row[]>([])
  const [busy, setBusy] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  // free the preview URLs when the dialog closes
  useEffect(() => {
    if (open) return
    setRows((r) => {
      r.forEach((x) => URL.revokeObjectURL(x.preview))
      return []
    })
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onClose])

  const add = (files: FileList | null) => {
    if (!files) return
    const picked = [...files].filter((f) => f.type.startsWith('image/') || /\.(heic|heif)$/i.test(f.name))
    setRows((r) =>
      [
        ...r,
        ...picked.map((file) => ({
          key: `${file.name}-${file.size}-${file.lastModified}-${Math.random()}`,
          file,
          preview: URL.createObjectURL(file),
          caption: '',
          date: fileDate(file),
          place: '',
          status: 'ready' as const,
        })),
      ].slice(0, MAX_FILES),
    )
  }

  const patch = (key: string, p: Partial<Row>) => setRows((r) => r.map((x) => (x.key === key ? { ...x, ...p } : x)))
  const remove = (key: string) =>
    setRows((r) => {
      const gone = r.find((x) => x.key === key)
      if (gone) URL.revokeObjectURL(gone.preview)
      return r.filter((x) => x.key !== key)
    })

  const pending = rows.filter((r) => r.status === 'ready' || r.status === 'error')
  const doneCount = rows.filter((r) => r.status === 'done').length

  const uploadAll = async () => {
    setBusy(true)
    for (const r of pending) {
      patch(r.key, { status: 'uploading', error: undefined })
      try {
        await uploadPhoto(year, r)
        patch(r.key, { status: 'done' })
      } catch (e) {
        patch(r.key, { status: 'error', error: friendlyError(e) })
      }
    }
    setBusy(false)
  }

  // close by itself once everything went up
  useEffect(() => {
    if (open && !busy && rows.length > 0 && rows.every((r) => r.status === 'done')) {
      const t = window.setTimeout(onClose, 700)
      return () => window.clearTimeout(t)
    }
  }, [open, busy, rows, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-[rgb(25_15_12/0.6)] p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => !busy && onClose()}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="upload-title"
            onClick={(e) => e.stopPropagation()}
            className="card flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden text-[var(--color-ink)]"
            initial={{ y: 30, scale: 0.97 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 20, opacity: 0 }}
          >
            <header className="flex items-center justify-between border-b border-black/5 px-6 py-4">
              <h2 id="upload-title" className="font-display text-2xl font-semibold">
                Add photos to Year {year}
              </h2>
              <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="rounded-full p-2 hover:bg-black/5">
                <Close size={20} />
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => {
                  add(e.target.files)
                  e.target.value = ''
                }}
              />
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  add(e.dataTransfer.files)
                }}
                disabled={busy || rows.length >= MAX_FILES}
                className="flex w-full flex-col items-center justify-center gap-1 rounded-2xl border-2 border-dashed border-black/15 px-6 py-8 text-center transition hover:border-[var(--accent)] hover:bg-white/60"
              >
                <span className="font-semibold">Choose photos or drop them here</span>
                <span className="text-sm text-[var(--color-ink-soft)]">
                  Up to {MAX_FILES} at a time. They’re shrunk to about 250 KB each before uploading.
                </span>
              </button>

              <ul className="mt-5 flex flex-col gap-4">
                {rows.map((r) => (
                  <li key={r.key} className="flex gap-4 rounded-2xl bg-white p-3 shadow-sm">
                    <img src={r.preview} alt="" className="h-28 w-28 shrink-0 rounded-xl object-cover" />
                    <div className="grid flex-1 gap-2 sm:grid-cols-2">
                      <input
                        aria-label="Caption"
                        placeholder="Caption"
                        value={r.caption}
                        maxLength={300}
                        disabled={r.status === 'uploading' || r.status === 'done'}
                        onChange={(e) => patch(r.key, { caption: e.target.value })}
                        className="rounded-lg border border-black/15 px-3 py-2 sm:col-span-2"
                      />
                      <input
                        aria-label="Date"
                        type="date"
                        value={r.date}
                        disabled={r.status === 'uploading' || r.status === 'done'}
                        onChange={(e) => patch(r.key, { date: e.target.value })}
                        className="rounded-lg border border-black/15 px-3 py-2"
                      />
                      <input
                        aria-label="Place"
                        placeholder="Place"
                        value={r.place}
                        maxLength={120}
                        disabled={r.status === 'uploading' || r.status === 'done'}
                        onChange={(e) => patch(r.key, { place: e.target.value })}
                        className="rounded-lg border border-black/15 px-3 py-2"
                      />
                      <div className="flex items-center justify-between text-xs sm:col-span-2">
                        <span
                          className={
                            r.status === 'error' ? 'text-red-700' : r.status === 'done' ? 'text-emerald-700' : 'text-[var(--color-ink-soft)]'
                          }
                          role="status"
                        >
                          {r.status === 'uploading' && 'Uploading…'}
                          {r.status === 'done' && 'Added ✓'}
                          {r.status === 'error' && r.error}
                          {r.status === 'ready' && r.file.name}
                        </span>
                        {(r.status === 'ready' || r.status === 'error') && !busy && (
                          <button type="button" onClick={() => remove(r.key)} className="text-[var(--color-ink-soft)] hover:text-red-700">
                            Remove
                          </button>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <footer className="flex items-center justify-between gap-4 border-t border-black/5 px-6 py-4">
              <span className="text-sm text-[var(--color-ink-soft)]">
                {busy ? `Uploading ${doneCount + 1} of ${rows.length}…` : rows.length ? `${pending.length} ready` : 'No photos picked yet'}
              </span>
              <button type="button" className="btn" disabled={busy || pending.length === 0} onClick={uploadAll}>
                {busy ? 'Uploading…' : pending.length > 1 ? `Upload ${pending.length} photos` : 'Upload'}
              </button>
            </footer>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
