import { motion } from 'motion/react'
import { useEffect, useState, type CSSProperties } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { config } from '../content/config'
import { letters } from '../content/letters'
import { BackLink } from '../components/BackLink'
import { Envelope } from '../components/Envelope'
import { ArrowLeft, ArrowRight } from '../components/Icons'
import { Lightbox } from '../components/Lightbox'
import { Polaroid } from '../components/Polaroid'
import { memoriesFor } from '../lib/content'

export default function Year() {
  const { n } = useParams()
  const year = Number(n)
  const info = config.years[year - 1]
  const [open, setOpen] = useState<number | null>(null)

  useEffect(() => {
    setOpen(null)
    window.scrollTo({ top: 0 })
  }, [year])

  if (!info || !Number.isInteger(year)) return <Navigate to="/" replace />

  const memories = memoriesFor(year)
  const letter = letters[`year${year}` as keyof typeof letters]
  const total = config.years.length
  const { background, accent, text } = info.theme
  const style = { '--bg': background, '--accent': accent, '--ink': text, color: text } as CSSProperties

  return (
    <main className="paper min-h-screen" style={style}>
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 pt-6">
        <BackLink />
        <span className="text-sm font-semibold tracking-[0.2em] uppercase opacity-60">
          Chapter {year} of {total}
        </span>
      </nav>

      <header className="mx-auto max-w-4xl px-6 pt-12 pb-14 text-center" key={`h${year}`}>
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 160, damping: 14 }}
          className="font-display mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full text-3xl font-semibold text-white shadow-lg"
          style={{ background: accent }}
        >
          {year}
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="font-display text-5xl leading-tight font-semibold sm:text-6xl"
        >
          {info.title}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.75 }}
          transition={{ delay: 0.3, duration: 0.7 }}
          className="font-display mt-4 text-xl italic"
        >
          {info.subtitle}
        </motion.p>
      </header>

      <section className="mx-auto max-w-6xl px-6 pb-20" aria-label="Photos">
        {memories.length === 0 ? (
          <p className="text-center opacity-60">No photos for this year yet. Add them in memories.json.</p>
        ) : (
          <motion.ul
            key={`w${year}`}
            className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-5"
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
          >
            {memories.map((m, i) => (
              <Polaroid key={`${year}-${i}`} memory={m} year={year} index={i} onOpen={() => setOpen(i)} />
            ))}
          </motion.ul>
        )}
      </section>

      {letter && (
        <section className="mx-auto max-w-4xl px-6 pb-24" aria-label="Letter">
          <div className="text-center">
            <h2 className="font-display text-3xl font-semibold">A letter for year {year}</h2>
          </div>
          <Envelope key={year} letter={letter} />
        </section>
      )}

      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 pb-16">
        {year > 1 ? (
          <Link to={`/year/${year - 1}`} className="btn btn-ghost">
            <ArrowLeft size={18} /> {config.years[year - 2].title}
          </Link>
        ) : (
          <span />
        )}
        {year < total ? (
          <Link to={`/year/${year + 1}`} className="btn">
            {config.years[year].title} <ArrowRight size={18} />
          </Link>
        ) : (
          <Link to="/finale" className="btn">
            {config.copy.finaleCardTitle} <ArrowRight size={18} />
          </Link>
        )}
      </nav>

      <Lightbox year={year} memories={memories} index={open} onChange={setOpen} />
    </main>
  )
}
