import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import { config } from '../content/config'
import { ChapterCard } from '../components/ChapterCard'
import { Countdown } from '../components/Countdown'
import { Gamepad, Heart, Lock } from '../components/Icons'
import { haversineKm } from '../lib/geo'
import { formatDate, isUnlocked, splitMs, startAt, unlockAt, useNow } from '../lib/time'

const distanceKm = Math.round(haversineKm(config.myCity, config.herCity))

function TogetherCounter() {
  const now = useNow(1000)
  const { days, hours, minutes, seconds } = splitMs(now - startAt)
  return (
    <div>
      <div className="font-display text-7xl leading-none font-semibold tabular-nums sm:text-8xl">
        {days.toLocaleString('en-IN')}
      </div>
      <div className="mt-2 text-sm font-semibold tracking-[0.2em] uppercase opacity-70">days together</div>
      <div className="mt-1 text-sm tabular-nums opacity-60">
        and {hours}h {String(minutes).padStart(2, '0')}m {String(seconds).padStart(2, '0')}s
      </div>
    </div>
  )
}

function DistanceBadge() {
  return (
    <div className="flex flex-col items-center gap-3">
      <svg viewBox="0 0 260 90" className="w-64" aria-hidden>
        <path
          id="arc"
          d="M20 70 Q130 -10 240 70"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.35"
          strokeWidth="2"
          strokeDasharray="5 7"
        />
        <circle cx="20" cy="70" r="6" fill="var(--accent)" />
        <circle cx="240" cy="70" r="6" fill="var(--accent)" />
        <g fill="var(--accent)">
          <path d="M0 -4 C -2 -8 -8 -8 -8 -3 C -8 1 0 6 0 6 C 0 6 8 1 8 -3 C 8 -8 2 -8 0 -4 Z">
            <animateMotion dur="5s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;0.5;1" calcMode="linear">
              <mpath href="#arc" />
            </animateMotion>
          </path>
        </g>
      </svg>
      <div className="-mt-4 flex w-72 justify-between text-xs font-semibold tracking-wider uppercase opacity-70">
        <span>{config.myCity.name}</span>
        <span>{config.herCity.name}</span>
      </div>
      <p className="text-center">
        <span className="font-display text-3xl font-semibold tabular-nums">{distanceKm.toLocaleString('en-IN')} km</span>
        <span className="mt-1 block max-w-64 text-sm opacity-70">{config.copy.distanceLine}</span>
      </p>
    </div>
  )
}

function FinaleCard() {
  const now = useNow(1000)
  const unlocked = isUnlocked(now)
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: 0.4, type: 'spring', stiffness: 110, damping: 18 }}
    >
      <Link
        to="/finale"
        className="group relative flex h-full min-h-[340px] flex-col justify-between overflow-hidden rounded-2xl p-6 text-white shadow-[0_18px_40px_-20px_rgb(60_30_20/0.7)] transition duration-300 hover:-translate-y-1.5"
        style={{ background: 'linear-gradient(150deg, #3a2420 0%, #7a2e2a 55%, var(--accent) 130%)' }}
      >
        <div className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] uppercase opacity-80">
          {unlocked ? <Heart size={14} /> : <Lock size={14} />}
          {unlocked ? 'Unlocked' : `Opens ${formatDate(config.anniversaryUnlock.slice(0, 10))}`}
        </div>
        <div>
          <h3 className="font-display text-3xl leading-tight font-semibold">{config.copy.finaleCardTitle}</h3>
          <p className="mt-2 text-sm opacity-80">
            {unlocked ? 'It is time. Open it.' : config.copy.finaleLockedLine}
          </p>
        </div>
        {unlocked ? (
          <span className="btn self-start bg-white text-[#7a2e2a]">Open the finale →</span>
        ) : (
          <Countdown target={unlockAt} compact />
        )}
      </Link>
    </motion.div>
  )
}

export default function Home() {
  return (
    <main className="paper min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pt-16 pb-14 sm:pt-24">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ delay: 0.2 }}
          className="text-center text-sm font-semibold tracking-[0.25em] uppercase"
        >
          Since {formatDate(config.relationshipStart)}
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="font-display mt-4 text-center text-6xl leading-[1.05] font-semibold sm:text-7xl lg:text-8xl"
        >
          {config.myName} <span className="font-normal italic text-[var(--accent)]">&amp;</span> {config.herName}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="font-display mt-5 text-center text-xl text-[var(--color-ink-soft)] italic sm:text-2xl"
        >
          {config.copy.homeTagline}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.7 }}
          className="card mx-auto mt-14 grid max-w-4xl items-center gap-10 px-8 py-10 text-center md:grid-cols-2 md:text-left"
        >
          <div className="flex justify-center md:justify-start md:pl-6">
            <TogetherCounter />
          </div>
          <DistanceBadge />
        </motion.div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-16" aria-labelledby="chapters">
        <h2 id="chapters" className="font-display mb-8 text-3xl font-semibold">
          Our chapters
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {config.years.map((info, i) => (
            <ChapterCard key={i} year={i + 1} info={info} index={i} />
          ))}
          <FinaleCard />
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-24">
        <Link
          to="/play"
          className="card group flex flex-col items-center justify-between gap-6 p-8 transition duration-300 hover:-translate-y-1 sm:flex-row"
        >
          <div className="flex items-center gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent)] text-white">
              <Gamepad size={28} />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">{config.copy.playTitle}</h2>
              <p className="text-[var(--color-ink-soft)]">{config.copy.playSubtitle}</p>
            </div>
          </div>
          <span className="btn">Let's play →</span>
        </Link>
      </section>

      <footer className="pb-10 text-center text-sm text-[var(--color-ink-soft)]">
        Made with <Heart size={14} className="inline text-[var(--accent)]" /> by {config.myName}
      </footer>
    </main>
  )
}
