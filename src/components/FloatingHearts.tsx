import { motion } from 'motion/react'
import { useMemo } from 'react'
import { Heart } from './Icons'

/** gentle hearts drifting upward; purely decorative */
export function FloatingHearts({ count = 18, color = 'var(--accent)' }: { count?: number; color?: string }) {
  const hearts = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i * 53) % 100,
        size: 14 + ((i * 7) % 22),
        delay: (i * 0.45) % 6,
        duration: 7 + ((i * 3) % 6),
        drift: ((i % 5) - 2) * 18,
      })),
    [count],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden" aria-hidden>
      {hearts.map((h) => (
        <motion.div
          key={h.id}
          className="absolute bottom-[-40px]"
          style={{ left: `${h.left}%`, color }}
          initial={{ y: 0, opacity: 0 }}
          animate={{ y: '-115vh', x: [0, h.drift, -h.drift, 0], opacity: [0, 0.85, 0.85, 0] }}
          transition={{ duration: h.duration, delay: h.delay, repeat: Infinity, ease: 'easeOut' }}
        >
          <Heart size={h.size} />
        </motion.div>
      ))}
    </div>
  )
}
