import {
  onDisconnect,
  onValue,
  ref,
  runTransaction,
  serverTimestamp,
  set,
  update,
  type Database,
} from 'firebase/database'
import { useCallback, useEffect, useState } from 'react'
import type { Role } from '../content/config'

/** everything shared lives under this single path */
export const ROOM = 'rooms/anniversary'

export type Player = { uid: string; online: boolean; lastSeen?: number }
export type Players = Partial<Record<Role, Player>>
export type GameKey = 'match' | 'quiz'

export const roomRef = (db: Database, path = '') => ref(db, path ? `${ROOM}/${path}` : ROOM)

/** live value at ROOM/path; `loaded` turns true after the first server answer */
export function useRoomValue<T>(db: Database | null, path: string) {
  const [state, setState] = useState<{ value: T | null; loaded: boolean; error: Error | null }>({
    value: null,
    loaded: false,
    error: null,
  })
  useEffect(() => {
    if (!db) return
    setState({ value: null, loaded: false, error: null })
    return onValue(
      roomRef(db, path),
      (snap) => setState({ value: (snap.val() as T) ?? null, loaded: true, error: null }),
      (error) => setState((s) => ({ ...s, loaded: true, error })),
    )
  }, [db, path])
  return state
}

/** true while the browser has a live connection to the database */
export function useConnected(db: Database | null): boolean {
  const [connected, setConnected] = useState(false)
  useEffect(() => {
    if (!db) return
    return onValue(ref(db, '.info/connected'), (snap) => setConnected(snap.val() === true))
  }, [db])
  return connected
}

/**
 * Atomic read-modify-write at ROOM/path. `fn` may run several times if the other
 * player writes at the same moment; return `undefined` to abort without writing.
 * Resolves to true when the change was committed.
 */
export async function transact<T>(
  db: Database,
  path: string,
  fn: (current: T | null) => T | null | undefined,
): Promise<boolean> {
  const result = await runTransaction(roomRef(db, path), (current) => fn((current as T) ?? null), {
    applyLocally: true,
  })
  return result.committed
}

/** wipes a game's state for both players */
export async function resetGame(db: Database, game: GameKey): Promise<void> {
  await set(roomRef(db, game), null)
}

/* ---------------------------- presence ---------------------------- */

/**
 * Marks `role` as online for this browser, marks it offline on disconnect,
 * and re-asserts after reconnects. If the same person opens the games on a
 * second device, the newer device wins and the older one reports `takenOver`.
 */
export function usePresence(db: Database | null, uid: string | null, role: Role | null) {
  const [takenOver, setTakenOver] = useState(false)
  const [force, setForce] = useState(0)

  useEffect(() => {
    if (!db || !uid || !role) return
    const playerRef = roomRef(db, `players/${role}`)
    let alive = true
    let connected = false
    let loaded = false
    let registered = false
    let latest: Player | null = null
    let forcing = force > 0

    const claim = () => {
      registered = true
      onDisconnect(playerRef)
        .update({ online: false, lastSeen: serverTimestamp() })
        .catch(() => (registered = false))
      set(playerRef, { uid, online: true, lastSeen: serverTimestamp() }).catch(() => {})
    }

    const evaluate = () => {
      if (!alive || !connected || !loaded) return
      const v = latest
      if (v && v.uid !== uid && v.online && !forcing) {
        // someone else (her other device, say) holds this seat now: step aside quietly
        if (registered) onDisconnect(playerRef).cancel().catch(() => {})
        registered = false
        setTakenOver(true)
        return
      }
      forcing = false
      setTakenOver(false)
      if (!v || v.uid !== uid || !v.online || !registered) claim()
    }

    const offConnected = onValue(ref(db, '.info/connected'), (snap) => {
      connected = snap.val() === true
      if (!connected) registered = false
      evaluate()
    })
    const offPlayer = onValue(playerRef, (snap) => {
      latest = (snap.val() as Player) ?? null
      loaded = true
      evaluate()
    })

    return () => {
      alive = false
      offConnected()
      offPlayer()
      if (latest?.uid === uid) {
        onDisconnect(playerRef).cancel().catch(() => {})
        update(playerRef, { online: false, lastSeen: serverTimestamp() }).catch(() => {})
      }
    }
  }, [db, uid, role, force])

  const reclaim = useCallback(() => setForce((n) => n + 1), [])
  return { takenOver, reclaim }
}

/* ------------------------ which person am I ------------------------ */

const ROLE_KEY = 'anniv-role'

export function loadRole(): Role | null {
  try {
    const r = localStorage.getItem(ROLE_KEY)
    return r === 'me' || r === 'her' ? r : null
  } catch {
    return null
  }
}

export function saveRole(role: Role | null) {
  try {
    if (role) localStorage.setItem(ROLE_KEY, role)
    else localStorage.removeItem(ROLE_KEY)
  } catch {
    /* ignore */
  }
}

/** "just now", "5 min ago", "yesterday" */
export function timeAgo(ms?: number): string {
  if (!ms) return 'not yet'
  const s = Math.max(0, (Date.now() - ms) / 1000)
  if (s < 60) return 'just now'
  if (s < 3600) return `${Math.floor(s / 60)} min ago`
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`
  const d = Math.floor(s / 86400)
  return d === 1 ? 'yesterday' : `${d} days ago`
}
