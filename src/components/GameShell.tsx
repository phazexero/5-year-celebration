import { AnimatePresence, motion } from 'motion/react'
import { useState, type ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { nameOf, otherRole } from '../content/config'
import { resetGame, type GameKey } from '../lib/room'
import { useRealtime } from '../lib/realtime'
import { BackLink } from './BackLink'
import { Heart } from './Icons'
import { PresenceBadge } from './PresenceBadge'

type Props = { game: GameKey; title: string; children: ReactNode; /** called after the room is wiped */ onReset?: () => void }

/** common frame for both games: header, presence, reset, and a pause screen when someone drops */
export function GameShell({ game, title, children, onReset }: Props) {
  const rt = useRealtime()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!rt.role) return <Navigate to="/play" replace />
  const partner = otherRole(rt.role)

  const doReset = async () => {
    setBusy(true)
    try {
      await resetGame(rt.db, game)
      onReset?.()
    } finally {
      setBusy(false)
      setConfirming(false)
    }
  }

  return (
    <main className="paper min-h-screen">
      <header className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-6 pt-6">
        <div className="flex items-center gap-4">
          <BackLink to="/play" label="Lobby" />
          <h1 className="font-display text-2xl font-semibold">{title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-5">
          <PresenceBadge role="me" player={rt.players.me} isYou={rt.role === 'me'} size="sm" />
          <PresenceBadge role="her" player={rt.players.her} isYou={rt.role === 'her'} size="sm" />
          {!rt.connected && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900" role="status">
              Reconnecting…
            </span>
          )}
          {confirming ? (
            <span className="flex items-center gap-2 text-sm">
              Reset for both of you?
              <button type="button" className="btn px-4 py-1.5 text-sm" onClick={doReset} disabled={busy}>
                Yes, reset
              </button>
              <button type="button" className="btn btn-ghost px-4 py-1.5 text-sm" onClick={() => setConfirming(false)}>
                Cancel
              </button>
            </span>
          ) : (
            <button type="button" className="btn btn-ghost px-4 py-1.5 text-sm" onClick={() => setConfirming(true)}>
              Reset game
            </button>
          )}
        </div>
      </header>

      <div className="relative mx-auto min-h-[70vh] max-w-6xl px-6 pt-8 pb-16">
        {children}

        <AnimatePresence>
          {(rt.takenOver || !rt.bothOnline) && (
            <motion.div
              key="pause"
              className="absolute inset-0 z-30 flex items-start justify-center rounded-3xl bg-[rgb(246_239_230/0.75)] pt-24 backdrop-blur-[3px]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              role="status"
            >
              <div className="card max-w-sm p-8 text-center">
                {rt.takenOver ? (
                  <>
                    <h2 className="font-display text-2xl font-semibold">Playing on another device</h2>
                    <p className="mt-2 text-[var(--color-ink-soft)]">
                      {nameOf(rt.role)} opened the games somewhere else, so this window stepped aside.
                    </p>
                    <button type="button" className="btn mt-6" onClick={rt.reclaim}>
                      Play here instead
                    </button>
                  </>
                ) : (
                  <>
                    <motion.div
                      className="mx-auto mb-4 w-fit text-[var(--accent)]"
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                    >
                      <Heart size={34} />
                    </motion.div>
                    <h2 className="font-display text-2xl font-semibold">
                      {rt.connected ? `Waiting for ${nameOf(partner)}` : 'Reconnecting…'}
                    </h2>
                    <p className="mt-2 text-[var(--color-ink-soft)]">
                      {rt.connected
                        ? 'The game is paused and saved. It carries on as soon as you are both here.'
                        : 'Your connection dropped. Hang on, the game is saved.'}
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  )
}
