import { serverTimestamp } from 'firebase/database'
import { otherRole, type Role } from '../content/config'
import { allPhotos, memoriesFor, type Memory } from './content'

/* Memory Lane Match: pure game rules, applied inside database transactions */

export type MatchMode = 'competitive' | 'coop'
export type Card = { y: number; i: number }

export type MatchState = {
  gameId: string
  status: 'playing' | 'done'
  mode: MatchMode
  deck: Card[]
  /** face up cards that aren't matched yet (0, 1 or 2) */
  flipped?: number[]
  /** two non matching cards are showing; they flip back after a short pause */
  mismatch?: boolean
  /** "c<card index>" -> who matched it (prefixed so the database keeps it an object) */
  matched?: Record<string, Role>
  scores: Record<Role, number>
  /** whose turn it is (competitive only) */
  turn: Role
  /** pair attempts */
  moves: number
  /** bumps on every change, so delayed actions can tell if the board moved on */
  seq: number
  startedAt: number | object
  finishedAt?: number | object
  lastMatch?: { card: number; by: Role; seq: number }
}

export type MatchBest = { timeMs: number; moves: number; at: number; gameId: string }

export const PAIRS = 8
export const MISMATCH_MS = 1200

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** fresh shuffled board: 8 random photos from across all five years, each twice */
export function newMatch(mode: MatchMode): MatchState {
  const picks = shuffle(allPhotos()).slice(0, PAIRS)
  const deck = shuffle(picks.flatMap((p) => [{ y: p.year, i: p.index }, { y: p.year, i: p.index }]))
  return {
    gameId: Math.random().toString(36).slice(2, 10),
    status: 'playing',
    mode,
    deck,
    scores: { me: 0, her: 0 },
    turn: Math.random() < 0.5 ? 'me' : 'her',
    moves: 0,
    seq: 0,
    startedAt: serverTimestamp(),
  }
}

export const matchedBy = (s: MatchState | null, k: number): Role | undefined => s?.matched?.[`c${k}`]
export const matchedCount = (s: MatchState | null) => Object.keys(s?.matched ?? {}).length

export const samePhoto = (a: Card, b: Card) => a.y === b.y && a.i === b.i
export const memoryOf = (c: Card): Memory | undefined => memoriesFor(c.y)[c.i]

export function canFlip(s: MatchState | null, role: Role, k: number): boolean {
  if (!s || s.status !== 'playing') return false
  if (s.mode === 'competitive' && s.turn !== role) return false
  const flipped = s.flipped ?? []
  if (flipped.length >= 2 || flipped.includes(k)) return false
  return !matchedBy(s, k) && k >= 0 && k < s.deck.length
}

/** transaction body for flipping card k; returns undefined when the move isn't allowed */
export function applyFlip(s: MatchState | null, role: Role, k: number): MatchState | undefined {
  if (!s || !canFlip(s, role, k)) return undefined
  const flipped = [...(s.flipped ?? []), k]
  const next: MatchState = { ...s, flipped, seq: (s.seq ?? 0) + 1 }
  if (flipped.length < 2) return next

  const [a, b] = flipped
  next.moves = (s.moves ?? 0) + 1
  if (!samePhoto(s.deck[a], s.deck[b])) {
    next.mismatch = true
    return next
  }

  const matched = { ...(s.matched ?? {}), [`c${a}`]: role, [`c${b}`]: role }
  next.matched = matched
  next.flipped = []
  next.lastMatch = { card: a, by: role, seq: next.seq }
  if (s.mode === 'competitive') next.scores = { ...s.scores, [role]: (s.scores?.[role] ?? 0) + 1 }
  // a match keeps the turn
  if (Object.keys(matched).length >= s.deck.length) {
    next.status = 'done'
    next.finishedAt = serverTimestamp()
  }
  return next
}

/** transaction body for turning a mismatched pair back over; no-op if the board already moved on */
export function applyFlipBack(s: MatchState | null, seenSeq: number): MatchState | undefined {
  if (!s || !s.mismatch || s.seq !== seenSeq) return undefined
  return {
    ...s,
    flipped: [],
    mismatch: false,
    seq: s.seq + 1,
    turn: s.mode === 'competitive' ? otherRole(s.turn) : s.turn,
  }
}

/** transaction body for saving a co-op result if it beats the best */
export function applyBest(best: MatchBest | null, candidate: MatchBest): MatchBest | undefined {
  if (best && (best.gameId === candidate.gameId || best.timeMs <= candidate.timeMs)) return undefined
  return candidate
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${String(s).padStart(2, '0')}`
}
