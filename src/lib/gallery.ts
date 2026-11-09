import { useEffect, useState } from 'react'
import { memoriesFor, photoUrl, YEARS } from './content'

/*
 * Photos added through the website. Firebase Storage needs a billing account, so to
 * stay free each photo is shrunk in the browser and stored in the Realtime Database:
 *   rooms/anniversary/gallery/meta/y<year>/<id>  caption, date, place, size
 *   rooms/anniversary/gallery/data/<id>          the image as a data: URL
 * Metadata is small and loads at once; image data loads per photo when shown.
 * Firebase is imported lazily so the first paint of the site stays light.
 */

export type Upload = {
  id: string
  year: number
  caption: string
  date: string
  place: string
  at: number
  w?: number
  h?: number
}

export type PhotoSource = { kind: 'static'; year: number; file: string } | { kind: 'upload'; id: string }

export type GalleryItem = {
  key: string
  year: number
  caption: string
  date: string
  place: string
  source: PhotoSource
  upload?: Upload
}

type Status = 'loading' | 'ready' | 'off' | 'error'
type Store = { status: Status; byYear: Record<number, Upload[]>; error?: string }

const MAX_EDGE = 1400
const QUALITY = 0.8
/** stay well under the database rule limit even for detailed photos */
const MAX_DATA_CHARS = 1_100_000

/* ---------------------------- lazy firebase ---------------------------- */

async function fb() {
  const [{ connectFirebase, isFirebaseConfigured }, database, room] = await Promise.all([
    import('./firebase'),
    import('firebase/database'),
    import('./room'),
  ])
  return { connectFirebase, isFirebaseConfigured, database, room }
}

/* ------------------------ shared metadata store ------------------------ */

let store: Store = { status: 'loading', byYear: {} }
const listeners = new Set<(s: Store) => void>()
let started = false

function emit(next: Store) {
  store = next
  listeners.forEach((l) => l(store))
}

function parseMeta(raw: Record<string, Record<string, Omit<Upload, 'id' | 'year'>>> | null) {
  const byYear: Record<number, Upload[]> = {}
  for (const y of YEARS) {
    const entries = raw?.[`y${y}`] ?? {}
    byYear[y] = Object.entries(entries)
      .map(([id, m]) => ({ id, year: y, caption: m.caption ?? '', date: m.date ?? '', place: m.place ?? '', at: m.at ?? 0, w: m.w, h: m.h }))
      .sort((a, b) => (a.date || '9999').localeCompare(b.date || '9999') || a.at - b.at)
  }
  return byYear
}

async function start() {
  if (started) return
  started = true
  try {
    const { connectFirebase, isFirebaseConfigured, database, room } = await fb()
    if (!isFirebaseConfigured()) {
      emit({ status: 'off', byYear: {} })
      return
    }
    const { db } = await connectFirebase()
    database.onValue(
      room.roomRef(db, 'gallery/meta'),
      (snap) => emit({ status: 'ready', byYear: parseMeta(snap.val()) }),
      (e) => emit({ status: 'error', byYear: store.byYear, error: e.message }),
    )
  } catch (e) {
    started = false
    emit({ status: 'error', byYear: {}, error: (e as Error).message })
  }
}

/** live list of uploaded photos, grouped by year */
export function useUploads() {
  const [s, setS] = useState(store)
  useEffect(() => {
    listeners.add(setS)
    setS(store)
    start()
    return () => {
      listeners.delete(setS)
    }
  }, [])
  return s
}

/** static photos from memories.json followed by uploaded ones, for one year */
export function itemsFor(year: number, byYear: Record<number, Upload[]>): GalleryItem[] {
  const statics: GalleryItem[] = memoriesFor(year).map((m, i) => ({
    key: `s${year}-${i}`,
    year,
    caption: m.caption,
    date: m.date,
    place: m.place,
    source: { kind: 'static', year, file: m.file },
  }))
  const uploads: GalleryItem[] = (byYear[year] ?? []).map((u) => ({
    key: `u${u.id}`,
    year,
    caption: u.caption,
    date: u.date,
    place: u.place,
    source: { kind: 'upload', id: u.id },
    upload: u,
  }))
  return [...statics, ...uploads]
}

export function useYearItems(year: number) {
  const s = useUploads()
  return { items: itemsFor(year, s.byYear), status: s.status, error: s.error }
}

/* ------------------------------ image data ------------------------------ */

const dataCache = new Map<string, Promise<string>>()

export function loadPhotoData(id: string): Promise<string> {
  let p = dataCache.get(id)
  if (!p) {
    p = (async () => {
      const { connectFirebase, database, room } = await fb()
      const { db } = await connectFirebase()
      const v = await new Promise<unknown>((resolve, reject) =>
        database.onValue(room.roomRef(db, `gallery/data/${id}`), (snap) => resolve(snap.val()), reject, {
          onlyOnce: true,
        }),
      )
      if (typeof v !== 'string') throw new Error('Photo not found')
      return v
    })()
    p.catch(() => dataCache.delete(id))
    dataCache.set(id, p)
  }
  return p
}

/** resolves any photo source to something an <img> can show ('' while loading) */
export function usePhotoSrc(source: PhotoSource): { src: string; failed: boolean } {
  const staticSrc = source.kind === 'static' ? photoUrl(source.year, source.file) : ''
  const id = source.kind === 'upload' ? source.id : ''
  const [state, setState] = useState<{ id: string; src: string; failed: boolean }>({ id: '', src: '', failed: false })
  useEffect(() => {
    if (!id) return
    let alive = true
    loadPhotoData(id).then(
      (src) => alive && setState({ id, src, failed: false }),
      () => alive && setState({ id, src: '', failed: true }),
    )
    return () => {
      alive = false
    }
  }, [id])
  if (staticSrc) return { src: staticSrc, failed: false }
  return state.id === id ? { src: state.src, failed: state.failed } : { src: '', failed: false }
}

/* -------------------------------- writing -------------------------------- */

/** shrinks a photo in the browser and returns it as a WebP data URL */
export async function shrinkImage(file: File): Promise<{ dataUrl: string; w: number; h: number }> {
  let bitmap: ImageBitmap
  try {
    // browsers apply the EXIF rotation here, so phone photos come out upright
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  } catch {
    throw new Error(
      /heic|heif/i.test(file.type + file.name)
        ? 'iPhone HEIC photos can’t be read by this browser. Export it as JPG first.'
        : 'This file couldn’t be read as an image.',
    )
  }
  const encode = (edge: number, quality: number) => {
    const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height))
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')!
    ctx.imageSmoothingQuality = 'high'
    ctx.drawImage(bitmap, 0, 0, w, h)
    let dataUrl = canvas.toDataURL('image/webp', quality)
    if (!dataUrl.startsWith('data:image/webp')) dataUrl = canvas.toDataURL('image/jpeg', quality) // older Safari
    return { dataUrl, w, h }
  }
  let out = encode(MAX_EDGE, QUALITY)
  if (out.dataUrl.length > MAX_DATA_CHARS) out = encode(1100, 0.72)
  if (out.dataUrl.length > MAX_DATA_CHARS) out = encode(900, 0.65)
  bitmap.close()
  return out
}

export type NewPhoto = { file: File; caption: string; date: string; place: string }

export async function uploadPhoto(year: number, p: NewPhoto): Promise<void> {
  const { dataUrl, w, h } = await shrinkImage(p.file)
  const { connectFirebase, database, room } = await fb()
  const { db } = await connectFirebase()
  const id = database.push(room.roomRef(db, `gallery/meta/y${year}`)).key!
  await database.update(room.roomRef(db, 'gallery'), {
    [`data/${id}`]: dataUrl,
    [`meta/y${year}/${id}`]: {
      caption: p.caption.trim().slice(0, 300),
      date: p.date.trim().slice(0, 20),
      place: p.place.trim().slice(0, 120),
      at: database.serverTimestamp(),
      w,
      h,
    },
  })
  dataCache.set(id, Promise.resolve(dataUrl))
}

export async function updateUpload(year: number, id: string, patch: Pick<Upload, 'caption' | 'date' | 'place'>) {
  const { connectFirebase, database, room } = await fb()
  const { db } = await connectFirebase()
  await database.update(room.roomRef(db, `gallery/meta/y${year}/${id}`), {
    caption: patch.caption.trim().slice(0, 300),
    date: patch.date.trim().slice(0, 20),
    place: patch.place.trim().slice(0, 120),
  })
}

export async function deleteUpload(year: number, id: string) {
  const { connectFirebase, database, room } = await fb()
  const { db } = await connectFirebase()
  await database.update(room.roomRef(db, 'gallery'), { [`meta/y${year}/${id}`]: null, [`data/${id}`]: null })
  dataCache.delete(id)
}

/** turns Firebase errors into something a person can act on */
export function friendlyError(e: unknown): string {
  const msg = (e as Error)?.message ?? ''
  if (/PERMISSION_DENIED/i.test(msg))
    return 'The database refused this. In Firebase, open Realtime Database, then Rules, paste the latest database.rules.json and press Publish.'
  if (/network|offline|timed out/i.test(msg)) return 'No connection right now. Check the internet and try again.'
  return msg || 'That didn’t work. Try again?'
}

/** today's date or the file's own date, as YYYY-MM-DD */
export function fileDate(file: File): string {
  const d = new Date(file.lastModified || Date.now())
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
