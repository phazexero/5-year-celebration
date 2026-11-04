import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { config, nameOf, otherRole, type Role } from '../content/config'
import { BackLink } from '../components/BackLink'
import { PresenceBadge } from '../components/PresenceBadge'
import { usingEmulator } from '../lib/firebase'
import { useRealtime } from '../lib/realtime'

const GAMES = [
  {
    path: 'match',
    title: 'Memory Lane Match',
    blurb: 'Flip our photos and find the pairs. Race each other or beat the board together.',
    emoji: '🃏',
  },
  {
    path: 'quiz',
    title: 'Who Knows Who Better',
    blurb: 'Answer about yourself, guess about the other. Reveal together and see who wins.',
    emoji: '💭',
  },
] as const

function PickRole() {
  const { setRole, players, uid } = useRealtime()
  const roles: Role[] = ['me', 'her']
  return (
    <section className="mx-auto max-w-3xl text-center">
      <h2 className="font-display text-3xl font-semibold">Who's on this laptop?</h2>
      <p className="mt-2 text-[var(--color-ink-soft)]">Pick once; this browser will remember.</p>
      <div className="mt-10 grid gap-6 sm:grid-cols-2">
        {roles.map((r, i) => {
          const p = players[r]
          const elsewhere = p?.online && p.uid !== uid
          return (
            <motion.button
              key={r}
              type="button"
              onClick={() => setRole(r)}
              className="card group flex flex-col items-center gap-4 p-10 transition hover:-translate-y-1.5"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <div
                className="font-display flex h-20 w-20 items-center justify-center rounded-full text-4xl font-semibold text-white shadow-lg transition group-hover:scale-105"
                style={{ background: r === 'me' ? '#7a2e2a' : 'var(--accent)' }}
              >
                {nameOf(r).charAt(0).toUpperCase()}
              </div>
              <div className="font-display text-2xl font-semibold">I'm {nameOf(r)}</div>
              {elsewhere && <div className="text-xs text-[var(--color-ink-soft)]">already online on another device</div>}
            </motion.button>
          )
        })}
      </div>
    </section>
  )
}

export default function Lobby() {
  const rt = useRealtime()

  return (
    <main className="paper min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <BackLink />
        {usingEmulator && (
          <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-semibold text-sky-900">Local emulator</span>
        )}
      </nav>

      <header className="mx-auto max-w-3xl px-6 pt-12 pb-10 text-center">
        <h1 className="font-display text-5xl font-semibold">{config.copy.playTitle}</h1>
        <p className="font-display mt-3 text-xl text-[var(--color-ink-soft)] italic">{config.copy.playSubtitle}</p>
      </header>

      <div className="mx-auto max-w-5xl px-6 pb-24">
        {!rt.role ? (
          <PickRole />
        ) : (
          <>
            <section className="card mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-6 px-8 py-6">
              <div className="flex flex-wrap items-center gap-10">
                <PresenceBadge role="me" player={rt.players.me} isYou={rt.role === 'me'} />
                <PresenceBadge role="her" player={rt.players.her} isYou={rt.role === 'her'} />
              </div>
              <button
                type="button"
                onClick={() => rt.setRole(null)}
                className="text-sm text-[var(--color-ink-soft)] underline-offset-4 hover:underline"
              >
                Not {nameOf(rt.role)}? Switch
              </button>
            </section>

            {rt.takenOver && (
              <div className="mx-auto mt-6 flex max-w-3xl flex-wrap items-center justify-between gap-4 rounded-2xl bg-amber-50 px-6 py-4 text-amber-900">
                <span>You're playing as {nameOf(rt.role)} on another device right now.</span>
                <button type="button" className="btn px-4 py-1.5 text-sm" onClick={rt.reclaim}>
                  Play here instead
                </button>
              </div>
            )}

            <p className="mt-8 text-center text-[var(--color-ink-soft)]" role="status">
              {rt.bothOnline
                ? `You're both here. Pick a game!`
                : `Games unlock when ${nameOf(otherRole(rt.role))} is online too. Send a nudge 💌`}
            </p>

            <section className="mt-8 grid gap-6 md:grid-cols-2">
              {GAMES.map((g, i) => {
                const disabled = !rt.bothOnline
                const inner = (
                  <>
                    <div className="flex h-12 items-center text-4xl" aria-hidden>
                      {g.emoji}
                    </div>
                    <h2 className="font-display mt-4 text-2xl font-semibold">{g.title}</h2>
                    <p className="mt-2 text-[var(--color-ink-soft)]">{g.blurb}</p>
                    <span className={`btn mt-6 self-start ${disabled ? 'opacity-50' : ''}`}>
                      {disabled ? 'Waiting for both' : 'Play →'}
                    </span>
                  </>
                )
                return (
                  <motion.div
                    key={g.path}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.1 }}
                  >
                    {disabled ? (
                      <div className="card flex h-full flex-col p-8 opacity-80" aria-disabled="true">
                        {inner}
                      </div>
                    ) : (
                      <Link
                        to={g.path}
                        className="card flex h-full flex-col p-8 transition duration-300 hover:-translate-y-1.5"
                      >
                        {inner}
                      </Link>
                    )}
                  </motion.div>
                )
              })}
            </section>
          </>
        )}
      </div>
    </main>
  )
}
