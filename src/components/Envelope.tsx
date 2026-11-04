import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import type { Letter } from '../content/letters'
import { Heart } from './Icons'
import { LetterCard } from './LetterCard'

type Stage = 'sealed' | 'opening' | 'open'

export function Envelope({ letter, label = 'Open the letter' }: { letter: Letter; label?: string }) {
  const [stage, setStage] = useState<Stage>('sealed')

  const open = () => {
    if (stage !== 'sealed') return
    setStage('opening')
    window.setTimeout(() => setStage('open'), 1500)
  }

  return (
    <div className={`flex flex-col items-center gap-10 transition-[padding] duration-500 ${stage === 'open' ? 'pt-8' : 'pt-44'}`}>
      <AnimatePresence initial={false}>
        {stage !== 'open' && (
          <motion.button
            key="envelope"
            type="button"
            onClick={open}
            disabled={stage !== 'sealed'}
            aria-label={label}
            className="group relative h-[230px] w-[360px] cursor-pointer disabled:cursor-default"
            style={{ perspective: 900 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30, scale: 0.9, transition: { duration: 0.4 } }}
            whileHover={stage === 'sealed' ? { y: -4, rotate: -1 } : undefined}
          >
            {/* back of envelope */}
            <div
              className="absolute inset-0 rounded-md"
              style={{ background: 'color-mix(in oklab, var(--accent) 55%, #f3e3d3)' }}
            />
            {/* the letter peeking out */}
            <motion.div
              className="letter-paper absolute inset-x-5 top-4 z-[1] h-[190px] rounded-sm shadow-md"
              animate={stage === 'opening' ? { y: -120 } : { y: 0 }}
              transition={{ delay: 0.55, duration: 0.8, ease: 'easeOut' }}
            >
              <div className="font-display px-5 pt-3 text-left text-sm italic text-neutral-600">{letter.greeting}</div>
            </motion.div>
            {/* front pocket */}
            <div
              className="absolute inset-0 rounded-md"
              style={{
                background: 'color-mix(in oklab, var(--accent) 35%, #fbefe3)',
                clipPath: 'polygon(0 0, 50% 55%, 100% 0, 100% 100%, 0 100%)',
                zIndex: 2,
              }}
            />
            {/* flap */}
            <motion.div
              className="absolute inset-x-0 top-0 h-[60%] origin-top"
              style={{
                background: 'color-mix(in oklab, var(--accent) 45%, #f7e6d6)',
                clipPath: 'polygon(0 0, 100% 0, 50% 100%)',
                transformStyle: 'preserve-3d',
                zIndex: stage === 'sealed' ? 3 : 0,
                filter: 'drop-shadow(0 2px 2px rgb(0 0 0 / 0.08))',
              }}
              animate={stage === 'opening' ? { rotateX: 180 } : { rotateX: 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            />
            {/* wax seal */}
            <motion.div
              className="absolute top-[60%] left-1/2 z-[4] -mt-7 -ml-7 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
              style={{ background: 'radial-gradient(circle at 35% 30%, color-mix(in oklab, var(--accent) 70%, white), var(--accent) 70%)' }}
              animate={stage === 'opening' ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Heart size={24} />
            </motion.div>
            {stage === 'sealed' && (
              <span className="absolute -bottom-9 left-0 right-0 text-center text-sm font-medium opacity-70 transition group-hover:opacity-100">
                {label}
              </span>
            )}
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {stage === 'open' && (
          <motion.div
            key="letter"
            className="w-full"
            initial={{ opacity: 0, y: 60, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
          >
            <LetterCard letter={letter} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
