import { config, otherRole, type Role } from '../content/config'
import { quiz, type QuizQuestion } from './content'

/* Who Knows Who Better: pure game rules, applied inside database transactions */

export type Answer = { v: string }
export type RoundRecord = { q: number; me: string; her: string; correct: boolean }

export type QuizState = {
  gameId: string
  status: 'playing' | 'done'
  /** indices into quiz.questions, in play order */
  order: number[]
  /** index into order */
  round: number
  phase: 'answering' | 'revealed'
  answers?: Partial<Record<Role, Answer>>
  /** free text rounds: who pressed "Match?" */
  agree?: Partial<Record<Role, boolean>>
  /** set once a round is revealed (multiple choice) or both agreed (free text) */
  correct?: boolean
  scores: Record<Role, number>
  /** "r<round>" -> what happened, for the recap */
  history?: Record<string, RoundRecord>
  seq: number
}

export const MAX_ANSWER = 200

const REMOVED: QuizQuestion = { about: 'her', text: '(this question was removed from quiz.json)' }
export const questionAt = (s: QuizState, round = s.round): QuizQuestion =>
  quiz.questions[s.order?.[round] ?? -1] ?? REMOVED

/** the person who guesses (and can score) this round */
export const guesserOf = (q: QuizQuestion): Role => otherRole(q.about)
export const isChoice = (q: QuizQuestion) => Array.isArray(q.options) && q.options.length > 0

/** text to show for a stored answer */
export function answerText(q: QuizQuestion, v: string | undefined): string {
  if (v === undefined) return ''
  if (isChoice(q)) return q.options![Number(v)] ?? v
  return v
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** questions alternate between being about each of you, shuffled within each person */
export function newQuiz(): QuizState {
  const idx = quiz.questions.map((_, i) => i)
  const pools: Record<Role, number[]> = {
    me: shuffle(idx.filter((i) => quiz.questions[i].about === 'me')),
    her: shuffle(idx.filter((i) => quiz.questions[i].about === 'her')),
  }
  const rounds = Math.min(quiz.roundsPerGame, idx.length)
  const order: number[] = []
  let turn: Role = Math.random() < 0.5 ? 'me' : 'her'
  while (order.length < rounds && (pools.me.length || pools.her.length)) {
    const pool = pools[turn].length ? pools[turn] : pools[otherRole(turn)]
    order.push(pool.shift()!)
    turn = otherRole(turn)
  }
  return {
    gameId: Math.random().toString(36).slice(2, 10),
    status: 'playing',
    order,
    round: 0,
    phase: 'answering',
    scores: { me: 0, her: 0 },
    seq: 0,
  }
}

const normalise = (v: string) => v.trim().replace(/\s+/g, ' ').slice(0, MAX_ANSWER)

export function applySubmit(s: QuizState | null, role: Role, round: number, raw: string): QuizState | undefined {
  if (!s || s.status !== 'playing' || s.phase !== 'answering' || s.round !== round) return undefined
  if (s.answers?.[role]) return undefined
  const v = normalise(raw)
  if (!v) return undefined
  const q = questionAt(s)
  const answers = { ...(s.answers ?? {}), [role]: { v } }
  const next: QuizState = { ...s, answers, seq: s.seq + 1 }
  if (answers.me && answers.her) {
    next.phase = 'revealed'
    if (isChoice(q)) {
      const correct = answers.me.v === answers.her.v
      next.correct = correct
      if (correct) {
        const g = guesserOf(q)
        next.scores = { ...s.scores, [g]: (s.scores?.[g] ?? 0) + 1 }
      }
    }
  }
  return next
}

/** free text rounds: both press "Match?" to award the point */
export function applyAgree(s: QuizState | null, role: Role, round: number, value: boolean): QuizState | undefined {
  if (!s || s.status !== 'playing' || s.phase !== 'revealed' || s.round !== round) return undefined
  const q = questionAt(s)
  if (isChoice(q) || s.correct) return undefined
  const agree = { ...(s.agree ?? {}), [role]: value }
  const next: QuizState = { ...s, agree, seq: s.seq + 1 }
  if (agree.me && agree.her) {
    next.correct = true
    const g = guesserOf(q)
    next.scores = { ...s.scores, [g]: (s.scores?.[g] ?? 0) + 1 }
  }
  return next
}

export function applyNext(s: QuizState | null, round: number): QuizState | undefined {
  if (!s || s.status !== 'playing' || s.phase !== 'revealed' || s.round !== round) return undefined
  const record: RoundRecord = {
    q: s.order[round],
    me: s.answers?.me?.v ?? '',
    her: s.answers?.her?.v ?? '',
    correct: !!s.correct,
  }
  const history = { ...(s.history ?? {}), [`r${round}`]: record }
  if (round + 1 >= s.order.length) {
    // last round: keep the final reveal on record and finish
    return { ...s, history, status: 'done', seq: s.seq + 1 }
  }
  return {
    ...s,
    history,
    round: round + 1,
    phase: 'answering',
    answers: {},
    agree: {},
    correct: false,
    seq: s.seq + 1,
  }
}

/** how many rounds each player was the guesser */
export function guessRounds(s: QuizState): Record<Role, number> {
  const n = { me: 0, her: 0 }
  for (const i of s.order ?? []) {
    const q = quiz.questions[i]
    if (q) n[guesserOf(q)]++
  }
  return n
}

/** playful title from the share of guesses that were right */
export function titleFor(score: number, rounds: number): string {
  const share = rounds ? score / rounds : 0
  const t = [...config.quizTitles].sort((a, b) => b.min - a.min).find((x) => share >= x.min)
  return t?.title ?? ''
}
