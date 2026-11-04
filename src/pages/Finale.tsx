import confetti from 'canvas-confetti'
import { motion } from 'motion/react'
import { lazy, Suspense, useRef, useState } from 'react'
import { config } from '../content/config'
import { finalLetter } from '../content/letters'
import { BackLink } from '../components/BackLink'
import { Countdown } from '../components/Countdown'
import { FloatingHearts } from '../components/FloatingHearts'
import { Heart, Lock } from '../components/Icons'
import { LetterCard } from '../components/LetterCard'
import { haversineKm } from '../lib/geo'
import { formatDate, isPreview, isUnlocked, unlockAt, useNow } from '../lib/time'

const FinaleMap = lazy(() => import('../components/FinaleMap'))

function celebrate() {
  const colors = ['#c2410c', '#f43f5e', '#fb7185', '#fbbf24', '#ffffff']
  const shoot = (x: number) =>
    confetti({ particleCount: 90, spread: 75, startVelocity: 45, origin: { x, y: 0.75 }, colors, scalar: 1.05 })
  shoot(0.2)
  window.setTimeout(() => shoot(0.8), 250)
  window.setTimeout(() => confetti({ particleCount: 140, spread: 120, origin: { y: 0.6 }, colors }), 600)
}

function Locked() {
  return (
    <main className="paper flex min-h-screen flex-col">
      <nav className="mx-auto w-full max-w-6xl px-6 pt-6">
        <BackLink />
      </nav>
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-24 text-center">
        <motion.div
          className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg"
          animate={{ rotate: [0, -6, 6, -3, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 2.5 }}
        >
          <Lock size={34} />
        </motion.div>
        <h1 className="font-display text-5xl font-semibold">{config.copy.finaleCardTitle}</h1>
        <p className="font-display mt-4 text-xl text-[var(--color-ink-soft)] italic">{config.copy.finaleLockedLine}</p>
        <div className="card mt-12 px-10 py-8">
          <Countdown target={unlockAt} />
        </div>
        <p className="mt-6 text-sm text-[var(--color-ink-soft)]">
          Unlocks {formatDate(config.anniversaryUnlock.slice(0, 10))} at {config.anniversaryUnlock.slice(11, 16)} (
          {config.timezone})
        </p>
      </div>
    </main>
  )
}

export default function Finale() {
  const now = useNow(1000)
  const [celebrated, setCelebrated] = useState(false)
  const fired = useRef(false)

  if (!isUnlocked(now)) return <Locked />

  const km = Math.round(haversineKm(config.myCity, config.herCity))

  return (
    <main className="paper min-h-screen">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <BackLink />
        {isPreview() && now < unlockAt && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-900">
            Preview mode
          </span>
        )}
      </nav>

      <header className="mx-auto max-w-4xl px-6 pt-14 pb-12 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.2, 1] }}
          transition={{ duration: 0.9 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-lg"
        >
          <Heart size={36} />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.9 }}
          className="font-display text-5xl leading-tight font-semibold sm:text-6xl"
        >
          {config.copy.finaleCardTitle}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 1 }}
          className="font-display mt-4 text-xl text-[var(--color-ink-soft)] italic"
        >
          {config.copy.finaleIntro}
        </motion.p>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1, duration: 0.9 }}
        className="mx-auto max-w-5xl px-6 pb-6"
        aria-label="Map"
      >
        <Suspense fallback={<div className="h-[460px] w-full animate-pulse rounded-2xl bg-black/5" />}>
          <FinaleMap />
        </Suspense>
        <p className="mt-4 text-center text-sm text-[var(--color-ink-soft)]">
          {config.myCity.name} to {config.herCity.name}: {km.toLocaleString('en-IN')} km
          {config.meetups.length > 0 && ` · ${config.meetups.length} places we met (tap the small hearts)`}
        </p>
      </motion.section>

      <section className="mx-auto max-w-4xl px-6 pt-16 pb-10" aria-label="Letter">
        <LetterCard letter={finalLetter} gentle />
      </section>

      <motion.section
        className="mx-auto max-w-4xl px-6 pt-6 pb-32 text-center"
        onViewportEnter={() => {
          if (fired.current) return
          fired.current = true
          setCelebrated(true)
          celebrate()
        }}
        viewport={{ once: true, amount: 0.8 }}
      >
        <motion.p
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2 }}
          className="font-display text-4xl font-semibold text-[var(--accent)]"
        >
          {config.copy.finaleOutro}
        </motion.p>
        <button type="button" onClick={celebrate} className="btn mt-10">
          <Heart size={18} /> Once more
        </button>
      </motion.section>

      {celebrated && <FloatingHearts />}
    </main>
  )
}
