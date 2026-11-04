import { motion } from 'motion/react'
import type { Letter } from '../content/letters'

type Props = { letter: Letter; /** fade paragraphs in one by one as they scroll into view */ gentle?: boolean }

export function LetterCard({ letter, gentle }: Props) {
  const paragraphs = letter.body
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)

  const item = (i: number) =>
    gentle
      ? {
          initial: { opacity: 0, y: 14, filter: 'blur(4px)' },
          whileInView: { opacity: 1, y: 0, filter: 'blur(0px)' },
          viewport: { once: true, amount: 0.6 },
          transition: { duration: 1.1, delay: 0.1 + i * 0.05, ease: 'easeOut' as const },
        }
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, delay: 0.25 + i * 0.12 },
        }

  return (
    <article className="letter-paper mx-auto w-full max-w-2xl rounded-md px-8 pt-8 pb-6 text-[17px] text-neutral-800 shadow-[0_24px_60px_-28px_rgb(60_30_20/0.5)] sm:px-14">
      <motion.p {...item(0)} className="font-display mb-8 text-2xl italic">
        {letter.greeting}
      </motion.p>
      {paragraphs.map((p, i) => (
        <motion.p key={i} {...item(i + 1)} className="mb-8 whitespace-pre-line">
          {p}
        </motion.p>
      ))}
      <motion.p {...item(paragraphs.length + 1)} className="font-display mt-4 text-right text-xl italic">
        {letter.signoff}
      </motion.p>
    </article>
  )
}
