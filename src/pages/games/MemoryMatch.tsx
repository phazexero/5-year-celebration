import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { config, nameOf, otherRole, type Role } from '../../content/config'
import { GameShell } from '../../components/GameShell'
import { Heart } from '../../components/Icons'
import { PhotoImage } from '../../components/PhotoImage'
import { photoUrl } from '../../lib/content'
import {
  applyBest,
  applyFlip,
  applyFlipBack,
  canFlip,
  formatDuration,
  matchedBy,
  matchedCount,
  memoryOf,
  MISMATCH_MS,
  newMatch,
  type Card,
  type MatchBest,
  type MatchMode,
  type MatchState,
} from '../../lib/match'
import { useRealtime } from '../../lib/realtime'
import { transact, useRoomValue, useServerOffset } from '../../lib/room'
import { formatDate, useNow } from '../../lib/time'

const accentOf = (y: number) => config.years[y - 1]?.theme.accent ?? 'var(--accent)'

/* ------------------------------ card ------------------------------ */

function MemoryCard({
  card,
  index,
  faceUp,
  matchedRole,
  clickable,
  onFlip,
}: {
  card: Card
  index: number
  faceUp: boolean
  matchedRole?: Role
  clickable: boolean
  onFlip: () => void
}) {
  const m = memoryOf(card)
  const label = faceUp ? `Card ${index + 1}: ${m?.caption ?? 'photo'}` : `Card ${index + 1}, face down`
  return (
    <button
      type="button"
      onClick={onFlip}
      disabled={!clickable}
      aria-label={label}
      aria-pressed={faceUp}
      className={`group relative aspect-square w-full [perspective:900px] ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
    >
      <motion.div
        className="preserve-3d relative h-full w-full"
        initial={false}
        animate={{ rotateY: faceUp ? 180 : 0, scale: matchedRole ? 0.96 : 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      >
        {/* back */}
        <div
          className={`backface-hidden absolute inset-0 flex items-center justify-center rounded-2xl text-white shadow-[0_10px_24px_-14px_rgb(60_30_20/0.7)] transition ${
            clickable ? 'group-hover:-translate-y-1 group-hover:shadow-[0_18px_30px_-16px_rgb(60_30_20/0.7)]' : ''
          }`}
          style={{
            background:
              'radial-gradient(circle at 30% 25%, rgb(255 255 255 / 0.18), transparent 45%), repeating-linear-gradient(45deg, #7a2e2a 0 10px, #84342f 10px 20px)',
          }}
        >
          <div className="flex h-[58%] w-[58%] items-center justify-center rounded-full border-2 border-white/40">
            <Heart size={30} className="opacity-90" />
          </div>
        </div>
        {/* front */}
        <div
          className="backface-hidden absolute inset-0 overflow-hidden rounded-2xl bg-white p-1.5 shadow-[0_10px_24px_-14px_rgb(60_30_20/0.7)]"
          style={{
            transform: 'rotateY(180deg)',
            boxShadow: matchedRole ? `0 0 0 3px ${accentOf(card.y)}, 0 10px 24px -14px rgb(60 30 20 / 0.7)` : undefined,
          }}
        >
          <PhotoImage
            src={photoUrl(card.y, m?.file ?? '')}
            alt={m?.caption ?? ''}
            accent={accentOf(card.y)}
            label={`Year ${card.y} · #${card.i + 1}`}
            eager
            className="h-full w-full rounded-xl"
          />
          {matchedRole && (
            <span
              className="font-display absolute top-2.5 right-2.5 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold text-white shadow"
              style={{ background: matchedRole === 'me' ? '#7a2e2a' : 'var(--accent)' }}
              title={`Matched by ${nameOf(matchedRole)}`}
            >
              {nameOf(matchedRole).charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </motion.div>
    </button>
  )
}

/* --------------------------- match toast --------------------------- */

function MatchToast({ state, loaded }: { state: MatchState | null; loaded: boolean }) {
  const [shown, setShown] = useState<{ card: Card; by: Role; key: string } | null>(null)
  const lastId = useRef<string | null | undefined>(undefined)

  const lm = state?.lastMatch
  const id = lm && state ? `${state.gameId}:${lm.seq}` : null
  useEffect(() => {
    // ignore whatever was already there when the page loaded (e.g. after a refresh)
    if (lastId.current === undefined) {
      if (!loaded) return
      lastId.current = id
      return
    }
    if (!id || !lm || !state || id === lastId.current) return
    lastId.current = id
    setShown({ card: state.deck[lm.card], by: lm.by, key: id })
    const t = window.setTimeout(() => setShown(null), 3600)
    return () => window.clearTimeout(t)
  }, [id, loaded]) // eslint-disable-line react-hooks/exhaustive-deps

  const m = shown ? memoryOf(shown.card) : undefined
  return (
    <AnimatePresence>
      {shown && m && (
        <motion.div
          key={shown.key}
          className="fixed right-6 bottom-6 z-40 w-[min(92vw,360px)]"
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 220, damping: 22 }}
          role="status"
        >
          <div className="card flex items-center gap-4 p-3 pr-5">
            <PhotoImage
              src={photoUrl(shown.card.y, m.file)}
              alt={m.caption}
              accent={accentOf(shown.card.y)}
              eager
              className="h-16 w-16 shrink-0 rounded-xl"
            />
            <div className="min-w-0">
              <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: accentOf(shown.card.y) }}>
                Match! · Year {shown.card.y}
                {m.date && /^\d{4}/.test(m.date) ? ` · ${formatDate(m.date)}` : ''}
              </p>
              <p className="font-display mt-1 line-clamp-2 text-lg leading-snug">{m.caption}</p>
              <p className="mt-0.5 text-xs text-[var(--color-ink-soft)]">found by {nameOf(shown.by)}</p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ------------------------------ setup ------------------------------ */

function Setup({ onStart, best }: { onStart: (mode: MatchMode) => void; best: MatchBest | null }) {
  const [mode, setMode] = useState<MatchMode>('competitive')
  const modes: { id: MatchMode; title: string; text: string }[] = [
    { id: 'competitive', title: 'Competitive', text: 'Take turns. A match scores a point and earns another go.' },
    {
      id: 'coop',
      title: 'Co-op',
      text: 'Either of you can flip any card, any time. Beat the board together against the clock.',
    },
  ]
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-3xl text-center">
      <h2 className="font-display text-4xl font-semibold">Memory Lane Match</h2>
      <p className="mt-2 text-[var(--color-ink-soft)]">
        Sixteen cards, eight pairs of our photos from all five years. Whoever presses start shuffles for both of you.
      </p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2" role="radiogroup" aria-label="Game mode">
        {modes.map((m) => (
          <button
            key={m.id}
            type="button"
            role="radio"
            aria-checked={mode === m.id}
            onClick={() => setMode(m.id)}
            className={`card p-7 text-left transition ${
              mode === m.id ? 'ring-4 ring-[var(--accent)]' : 'opacity-80 hover:opacity-100'
            }`}
          >
            <div className="font-display text-2xl font-semibold">{m.title}</div>
            <p className="mt-2 text-sm text-[var(--color-ink-soft)]">{m.text}</p>
            {m.id === 'coop' && best && (
              <p className="mt-3 text-xs font-semibold text-[var(--accent)]">
                Our best: {formatDuration(best.timeMs)} in {best.moves} moves
              </p>
            )}
          </button>
        ))}
      </div>
      <button type="button" className="btn mt-10 px-8 py-3 text-lg" onClick={() => onStart(mode)}>
        Shuffle and start
      </button>
    </motion.section>
  )
}

/* ---------------------------- end screen ---------------------------- */

function EndScreen({
  state,
  role,
  best,
  onAgain,
  onChangeMode,
}: {
  state: MatchState
  role: Role
  best: MatchBest | null
  onAgain: () => void
  onChangeMode: () => void
}) {
  const coop = state.mode === 'coop'
  const time =
    typeof state.finishedAt === 'number' && typeof state.startedAt === 'number' ? state.finishedAt - state.startedAt : 0
  const isBest = coop && best?.gameId === state.gameId
  const me = state.scores?.me ?? 0
  const her = state.scores?.her ?? 0
  const winner: Role | null = me === her ? null : me > her ? 'me' : 'her'

  useEffect(() => {
    const colors = ['#c2410c', '#f43f5e', '#fbbf24', '#ffffff']
    confetti({ particleCount: 120, spread: 90, origin: { y: 0.6 }, colors })
  }, [state.gameId])

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="card mx-auto max-w-xl p-10 text-center"
    >
      <div className="mx-auto mb-5 w-fit text-[var(--accent)]">
        <Heart size={44} />
      </div>
      {coop ? (
        <>
          <h2 className="font-display text-4xl font-semibold">Board cleared, together</h2>
          <p className="font-display mt-6 text-6xl font-semibold tabular-nums">{formatDuration(time)}</p>
          <p className="mt-1 text-[var(--color-ink-soft)]">{state.moves} moves</p>
          {isBest ? (
            <p className="mt-4 inline-block rounded-full bg-amber-100 px-4 py-1 text-sm font-semibold text-amber-900">
              New best!
            </p>
          ) : (
            best && (
              <p className="mt-4 text-sm text-[var(--color-ink-soft)]">
                Our best: {formatDuration(best.timeMs)} in {best.moves} moves
              </p>
            )
          )}
          <p className="font-display mt-6 text-lg italic">{config.copy.matchWinCoop}</p>
        </>
      ) : (
        <>
          <h2 className="font-display text-4xl font-semibold">
            {winner ? (winner === role ? 'You win!' : `${nameOf(winner)} wins!`) : "It's a tie!"}
          </h2>
          <div className="mt-8 flex items-end justify-center gap-10">
            {(['me', 'her'] as Role[]).map((r) => (
              <div key={r}>
                <div className={`font-display text-6xl font-semibold tabular-nums ${winner === r ? 'text-[var(--accent)]' : ''}`}>
                  {state.scores?.[r] ?? 0}
                </div>
                <div className="mt-1 text-sm font-semibold">{nameOf(r)}</div>
              </div>
            ))}
          </div>
          <p className="font-display mt-8 text-lg italic">{config.copy.matchWinCompetitive}</p>
        </>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <button type="button" className="btn" onClick={onAgain}>
          Play again
        </button>
        <button type="button" className="btn btn-ghost" onClick={onChangeMode}>
          Change mode
        </button>
      </div>
    </motion.section>
  )
}

/* ------------------------------ board ------------------------------ */

function Scoreboard({ state, role, serverNow }: { state: MatchState; role: Role; serverNow: number }) {
  if (state.mode === 'coop') {
    const started = typeof state.startedAt === 'number' ? state.startedAt : serverNow
    return (
      <div className="flex items-center justify-center gap-10" aria-live="off">
        <div className="text-center">
          <div className="font-display text-4xl font-semibold tabular-nums">{formatDuration(serverNow - started)}</div>
          <div className="text-xs font-semibold tracking-widest uppercase opacity-60">time</div>
        </div>
        <div className="text-center">
          <div className="font-display text-4xl font-semibold tabular-nums">{state.moves ?? 0}</div>
          <div className="text-xs font-semibold tracking-widest uppercase opacity-60">moves</div>
        </div>
        <div className="text-center">
          <div className="font-display text-4xl font-semibold tabular-nums">
            {matchedCount(state) / 2}/{state.deck.length / 2}
          </div>
          <div className="text-xs font-semibold tracking-widest uppercase opacity-60">pairs</div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-center gap-4 sm:gap-8">
      {(['me', 'her'] as Role[]).map((r) => {
        const active = state.turn === r
        return (
          <motion.div
            key={r}
            animate={{ scale: active ? 1.05 : 1, opacity: active ? 1 : 0.6 }}
            className={`card flex min-w-44 items-center gap-4 px-5 py-3 ${active ? 'ring-4 ring-[var(--accent)]' : ''}`}
          >
            <div className="font-display text-4xl font-semibold tabular-nums">{state.scores?.[r] ?? 0}</div>
            <div className="text-left leading-tight">
              <div className="font-semibold">{nameOf(r)}</div>
              <div className="text-xs text-[var(--color-ink-soft)]">
                {active ? (r === role ? 'your turn' : 'their turn') : r === role ? 'you' : ''}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ------------------------------- page ------------------------------- */

export default function MemoryMatch() {
  const rt = useRealtime()
  const role = rt.role!
  const { value: state, loaded } = useRoomValue<MatchState>(rt.db, 'match')
  const { value: best } = useRoomValue<MatchBest>(rt.db, 'matchBest')
  const offset = useServerOffset(rt.db)
  const now = useNow(state?.mode === 'coop' && state.status === 'playing' ? 500 : 60000)
  const serverNow = now + offset

  // a mismatched pair stays visible for a moment, then whoever's screen gets there first flips it back
  const mismatchSeq = state?.mismatch ? state.seq : null
  useEffect(() => {
    if (mismatchSeq === null) return
    const id = window.setTimeout(() => {
      transact<MatchState>(rt.db, 'match', (s) => applyFlipBack(s, mismatchSeq)).catch(() => {})
    }, MISMATCH_MS)
    return () => window.clearTimeout(id)
  }, [mismatchSeq, rt.db])

  // record a finished co-op board as our best if it beats the old one (idempotent from both screens)
  useEffect(() => {
    if (!state || state.status !== 'done' || state.mode !== 'coop') return
    if (typeof state.finishedAt !== 'number' || typeof state.startedAt !== 'number') return
    const candidate: MatchBest = {
      timeMs: state.finishedAt - state.startedAt,
      moves: state.moves,
      at: state.finishedAt,
      gameId: state.gameId,
    }
    transact<MatchBest>(rt.db, 'matchBest', (b) => applyBest(b, candidate)).catch(() => {})
  }, [state?.status, state?.gameId, state?.finishedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const start = (mode: MatchMode) =>
    transact<MatchState>(rt.db, 'match', (s) => (s && s.status === 'playing' ? undefined : newMatch(mode)))
  const again = () =>
    transact<MatchState>(rt.db, 'match', (s) => (s && s.status === 'playing' ? undefined : newMatch(s?.mode ?? 'competitive')))
  const changeMode = () => transact<MatchState>(rt.db, 'match', (s) => (s && s.status === 'done' ? null : undefined))
  const flip = (k: number) => transact<MatchState>(rt.db, 'match', (s) => applyFlip(s, role, k)).catch(() => {})

  let body
  if (!loaded) {
    body = <p className="py-24 text-center text-[var(--color-ink-soft)]">Loading the board…</p>
  } else if (!state) {
    body = <Setup onStart={start} best={best} />
  } else if (state.status === 'done') {
    body = <EndScreen state={state} role={role} best={best} onAgain={again} onChangeMode={changeMode} />
  } else {
    const flipped = state.flipped ?? []
    const myTurn = state.mode === 'coop' || state.turn === role
    body = (
      <section>
        <Scoreboard state={state} role={role} serverNow={serverNow} />
        <p className="mt-4 min-h-6 text-center text-sm text-[var(--color-ink-soft)]" role="status">
          {state.mismatch
            ? 'Not a pair…'
            : state.mode === 'coop'
              ? 'Flip any card. Teamwork!'
              : myTurn
                ? 'Your turn: flip two cards'
                : `Waiting for ${nameOf(otherRole(role))} to flip`}
        </p>
        <div
          className="mx-auto mt-6 grid grid-cols-4 gap-3 sm:gap-4"
          style={{ maxWidth: 'min(640px, max(340px, calc(100vh - 290px)))' }}
        >
          {state.deck.map((card, k) => {
            const mb = matchedBy(state, k)
            return (
              <MemoryCard
                key={`${state.gameId}-${k}`}
                card={card}
                index={k}
                faceUp={!!mb || flipped.includes(k)}
                matchedRole={mb}
                clickable={rt.bothOnline && canFlip(state, role, k)}
                onFlip={() => flip(k)}
              />
            )
          })}
        </div>
      </section>
    )
  }

  return (
    <GameShell game="match" title="Memory Lane Match">
      {body}
      <MatchToast state={state} loaded={loaded} />
    </GameShell>
  )
}
