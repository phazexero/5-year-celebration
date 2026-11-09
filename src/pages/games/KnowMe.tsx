import confetti from 'canvas-confetti'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState, type FormEvent } from 'react'
import { config, nameOf, otherRole, type Role } from '../../content/config'
import { GameShell } from '../../components/GameShell'
import { Heart } from '../../components/Icons'
import { quiz } from '../../lib/content'
import {
  answerText,
  applyAgree,
  applyNext,
  applySubmit,
  guessRounds,
  guesserOf,
  isChoice,
  MAX_ANSWER,
  newQuiz,
  questionAt,
  titleFor,
  type QuizState,
} from '../../lib/quiz'
import { useRealtime } from '../../lib/realtime'
import { transact, useRoomValue } from '../../lib/room'

const roleColor = (r: Role) => (r === 'me' ? '#7a2e2a' : 'var(--accent)')

/* ------------------------------ setup ------------------------------ */

function Setup({ onStart }: { onStart: () => void }) {
  const rounds = Math.min(quiz.roundsPerGame, quiz.questions.length)
  return (
    <motion.section initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl text-center">
      <h2 className="font-display text-4xl font-semibold">Who Knows Who Better</h2>
      <p className="mt-3 text-[var(--color-ink-soft)]">
        Each round is about one of you. That person answers truthfully; the other guesses. Answers stay hidden until you
        have both locked in, then flip over together. A right guess scores a point.
      </p>
      <div className="mt-8 flex justify-center gap-10 text-sm">
        <div>
          <div className="font-display text-4xl font-semibold">{rounds}</div>
          <div className="text-[var(--color-ink-soft)]">rounds</div>
        </div>
        <div>
          <div className="font-display text-4xl font-semibold">{quiz.questions.length}</div>
          <div className="text-[var(--color-ink-soft)]">questions in the deck</div>
        </div>
      </div>
      {quiz.questions.length === 0 ? (
        <p className="mt-10 text-[var(--accent)]">Add some questions to src/content/quiz.json first.</p>
      ) : (
        <button type="button" className="btn mt-10 px-8 py-3 text-lg" onClick={onStart}>
          Start the quiz
        </button>
      )}
    </motion.section>
  )
}

/* ---------------------------- scoreboard ---------------------------- */

function Scores({ s, role }: { s: QuizState; role: Role }) {
  return (
    <div className="flex items-center justify-center gap-4">
      {(['me', 'her'] as Role[]).map((r) => (
        <div key={r} className="card flex min-w-40 items-center gap-3 px-5 py-2.5">
          <motion.div
            key={s.scores?.[r]}
            initial={{ scale: 1.6, color: '#16a34a' }}
            animate={{ scale: 1, color: 'currentColor' }}
            className="font-display text-3xl font-semibold tabular-nums"
          >
            {s.scores?.[r] ?? 0}
          </motion.div>
          <div className="text-left leading-tight">
            <div className="font-semibold">{nameOf(r)}</div>
            <div className="text-xs text-[var(--color-ink-soft)]">{r === role ? 'you' : ''}</div>
          </div>
        </div>
      ))}
    </div>
  )
}

/* ------------------------------ input ------------------------------ */

function AnswerInput({ s, role, onSubmit }: { s: QuizState; role: Role; onSubmit: (v: string) => void }) {
  const q = questionAt(s)
  const [choice, setChoice] = useState<number | null>(null)
  const [text, setText] = useState('')
  const answering = q.about === role

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (isChoice(q)) {
      if (choice !== null) onSubmit(String(choice))
    } else if (text.trim()) onSubmit(text)
  }

  return (
    <form onSubmit={submit} className="mt-8">
      <p className="mb-4 text-center font-semibold">
        {answering ? 'This one is about you. Answer truthfully.' : `Guess what ${nameOf(q.about)} would say.`}
      </p>
      {isChoice(q) ? (
        <div className="grid gap-3 sm:grid-cols-2" role="radiogroup" aria-label="Options">
          {q.options!.map((opt, i) => (
            <button
              key={i}
              type="button"
              role="radio"
              aria-checked={choice === i}
              onClick={() => setChoice(i)}
              className={`rounded-2xl border-2 bg-white px-5 py-4 text-left font-medium transition ${
                choice === i
                  ? 'border-[var(--accent)] bg-[color-mix(in_oklab,var(--accent)_8%,white)] shadow-md'
                  : 'border-black/10 hover:border-black/25'
              }`}
            >
              <span className="mr-3 inline-flex h-7 w-7 items-center justify-center rounded-full bg-black/5 text-sm font-semibold">
                {String.fromCharCode(65 + i)}
              </span>
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <label htmlFor="answer" className="sr-only">
            Your answer
          </label>
          <input
            id="answer"
            value={text}
            maxLength={MAX_ANSWER}
            autoFocus
            autoComplete="off"
            onChange={(e) => setText(e.target.value)}
            placeholder={answering ? 'The truth, the whole truth…' : 'Your best guess…'}
            className="w-full rounded-2xl border-2 border-black/10 bg-white px-5 py-4 text-lg outline-none transition focus:border-[var(--accent)]"
          />
        </div>
      )}
      <div className="mt-6 text-center">
        <button type="submit" className="btn px-8" disabled={isChoice(q) ? choice === null : !text.trim()}>
          Lock it in
        </button>
      </div>
    </form>
  )
}

/* ------------------------------ reveal ------------------------------ */

function RevealCard({ who, label, text, delay }: { who: Role; label: string; text: string; delay: number }) {
  return (
    <div className="[perspective:1000px]">
      <motion.div
        initial={{ rotateY: -100, opacity: 0 }}
        animate={{ rotateY: 0, opacity: 1 }}
        transition={{ delay, type: 'spring', stiffness: 120, damping: 16 }}
        className="card h-full p-6"
        style={{ borderTop: `5px solid ${roleColor(who)}` }}
      >
        <p className="text-xs font-semibold tracking-widest uppercase" style={{ color: roleColor(who) }}>
          {label}
        </p>
        <p className="font-display mt-3 text-2xl leading-snug break-words">{text}</p>
      </motion.div>
    </div>
  )
}

function Reveal({
  s,
  role,
  onAgree,
  onNext,
}: {
  s: QuizState
  role: Role
  onAgree: (v: boolean) => void
  onNext: () => void
}) {
  const q = questionAt(s)
  const guesser = guesserOf(q)
  const truth = answerText(q, s.answers?.[q.about]?.v)
  const guess = answerText(q, s.answers?.[guesser]?.v)
  const last = s.round + 1 >= s.order.length
  const iAgree = !!s.agree?.[role]
  const theyAgree = !!s.agree?.[otherRole(role)]

  return (
    <div className="mt-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <RevealCard who={q.about} label={`${nameOf(q.about)}'s answer`} text={truth} delay={0.05} />
        <RevealCard who={guesser} label={`${nameOf(guesser)}'s guess`} text={guess} delay={0.35} />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-8 text-center"
        role="status"
      >
        {s.correct ? (
          <p className="font-display text-3xl font-semibold text-emerald-700">
            Spot on! +1 for {nameOf(guesser)}
          </p>
        ) : isChoice(q) ? (
          <p className="font-display text-3xl font-semibold">Not quite!</p>
        ) : (
          <div>
            <p className="font-display text-2xl font-semibold">Close enough to count?</p>
            <p className="mt-1 text-sm text-[var(--color-ink-soft)]">The point goes in when you both press Match.</p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-4">
              <button
                type="button"
                aria-pressed={iAgree}
                onClick={() => onAgree(!iAgree)}
                className={`btn ${iAgree ? '' : 'btn-ghost'}`}
              >
                <Heart size={16} filled={iAgree} /> {iAgree ? 'You said match' : 'Match?'}
              </button>
              <span className="text-sm text-[var(--color-ink-soft)]">
                {nameOf(otherRole(role))} {theyAgree ? 'says match ✓' : "hasn't pressed yet"}
              </span>
            </div>
          </div>
        )}
      </motion.div>

      <div className="mt-10 text-center">
        <button type="button" className="btn btn-ghost" onClick={onNext}>
          {last ? 'See the results →' : 'Next question →'}
        </button>
      </div>
    </div>
  )
}

/* ---------------------------- end screen ---------------------------- */

function EndScreen({ s, role, onAgain }: { s: QuizState; role: Role; onAgain: () => void }) {
  const me = s.scores?.me ?? 0
  const her = s.scores?.her ?? 0
  const winner: Role | null = me === her ? null : me > her ? 'me' : 'her'
  const rounds = guessRounds(s)
  const records = Object.entries(s.history ?? {})
    .map(([k, r]) => ({ i: Number(k.slice(1)), ...r }))
    .sort((a, b) => a.i - b.i)

  useEffect(() => {
    confetti({ particleCount: 140, spread: 100, origin: { y: 0.55 }, colors: ['#c2410c', '#f43f5e', '#fbbf24', '#ffffff'] })
  }, [s.gameId])

  return (
    <motion.section initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="mx-auto max-w-3xl">
      <div className="card p-10 text-center">
        <h2 className="font-display text-4xl font-semibold">
          {winner ? (winner === role ? 'You know them best!' : `${nameOf(winner)} knows you best!`) : 'A perfect tie!'}
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {(['me', 'her'] as Role[]).map((r) => (
            <div key={r} className="rounded-2xl bg-black/[0.03] p-6">
              <div className={`font-display text-6xl font-semibold tabular-nums ${winner === r ? 'text-[var(--accent)]' : ''}`}>
                {s.scores?.[r] ?? 0}
                <span className="text-2xl text-[var(--color-ink-soft)]">/{rounds[r]}</span>
              </div>
              <div className="mt-1 font-semibold">{nameOf(r)}</div>
              <div className="mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold text-white" style={{ background: roleColor(r) }}>
                {titleFor(s.scores?.[r] ?? 0, rounds[r])}
              </div>
            </div>
          ))}
        </div>
        <p className="font-display mt-8 text-lg italic">{config.copy.quizEnd}</p>
        <button type="button" className="btn mt-8" onClick={onAgain}>
          Play again
        </button>
      </div>

      {records.length > 0 && (
        <div className="card mt-6 p-6">
          <h3 className="font-display mb-4 text-xl font-semibold">The recap</h3>
          <ol className="divide-y divide-black/5">
            {records.map((r) => {
              const q = quiz.questions[r.q]
              if (!q) return null
              const g = guesserOf(q)
              return (
                <li key={r.i} className="flex items-start gap-4 py-3 text-sm">
                  <span className={`mt-0.5 font-semibold ${r.correct ? 'text-emerald-600' : 'text-neutral-400'}`} aria-label={r.correct ? 'correct' : 'wrong'}>
                    {r.correct ? '✓' : '✗'}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{q.text}</p>
                    <p className="mt-0.5 text-[var(--color-ink-soft)]">
                      {nameOf(q.about)}: {answerText(q, r[q.about])} · {nameOf(g)} guessed: {answerText(q, r[g])}
                    </p>
                  </div>
                </li>
              )
            })}
          </ol>
        </div>
      )}
    </motion.section>
  )
}

/* ------------------------------- page ------------------------------- */

export default function KnowMe() {
  const rt = useRealtime()
  const role = rt.role!
  const { value: s, loaded } = useRoomValue<QuizState>(rt.db, 'quiz')

  const start = () => transact<QuizState>(rt.db, 'quiz', (cur) => (cur && cur.status === 'playing' ? undefined : newQuiz()))
  const submit = (v: string) => s && transact<QuizState>(rt.db, 'quiz', (cur) => applySubmit(cur, role, s.round, v))
  const agree = (v: boolean) => s && transact<QuizState>(rt.db, 'quiz', (cur) => applyAgree(cur, role, s.round, v))
  const next = () => s && transact<QuizState>(rt.db, 'quiz', (cur) => applyNext(cur, s.round))

  let body
  if (!loaded) {
    body = <p className="py-24 text-center text-[var(--color-ink-soft)]">Loading the quiz…</p>
  } else if (!s) {
    body = <Setup onStart={start} />
  } else if (s.status === 'done') {
    body = <EndScreen s={s} role={role} onAgain={start} />
  } else {
    const q = questionAt(s)
    const mine = s.answers?.[role]
    const partner = otherRole(role)
    const partnerDone = !!s.answers?.[partner]
    body = (
      <section className="mx-auto max-w-3xl">
        <Scores s={s} role={role} />
        <AnimatePresence mode="wait">
          <motion.div
            key={`${s.gameId}-${s.round}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.3 }}
            className="card mt-8 p-8 sm:p-10"
          >
            <div className="flex items-center justify-between text-xs font-semibold tracking-widest uppercase">
              <span className="text-[var(--color-ink-soft)]">
                Round {s.round + 1} of {s.order.length}
              </span>
              <span className="rounded-full px-3 py-1 text-white" style={{ background: roleColor(q.about) }}>
                About {nameOf(q.about)}
              </span>
            </div>
            <h2 className="font-display mt-5 text-3xl leading-snug font-semibold">{q.text}</h2>

            {s.phase === 'revealed' ? (
              <Reveal s={s} role={role} onAgree={agree} onNext={next} />
            ) : mine ? (
              <div className="mt-8 text-center" role="status">
                <p className="text-sm text-[var(--color-ink-soft)]">Locked in</p>
                <p className="font-display mt-1 text-2xl">{answerText(q, mine.v)}</p>
                <motion.p
                  className="mt-6 text-[var(--color-ink-soft)]"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 1.6, repeat: Infinity }}
                >
                  Waiting for {nameOf(partner)}…
                </motion.p>
              </div>
            ) : (
              <>
                <AnswerInput key={`${s.gameId}-${s.round}`} s={s} role={role} onSubmit={submit} />
                <p className="mt-6 text-center text-sm text-[var(--color-ink-soft)]" role="status">
                  {partnerDone ? `${nameOf(partner)} has locked in ✓` : `${nameOf(partner)} is thinking…`}
                </p>
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    )
  }

  return (
    <GameShell game="quiz" title="Who Knows Who Better">
      {body}
    </GameShell>
  )
}
