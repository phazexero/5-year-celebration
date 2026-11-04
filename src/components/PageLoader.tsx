import { motion } from 'motion/react'
import { Heart } from './Icons'

export function PageLoader({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="paper flex min-h-screen flex-col items-center justify-center gap-4" role="status">
      <motion.div
        className="text-[var(--accent)]"
        animate={{ scale: [1, 1.18, 1] }}
        transition={{ duration: 1, repeat: Infinity }}
      >
        <Heart size={40} />
      </motion.div>
      <span className="text-sm text-[var(--color-ink-soft)]">{label}…</span>
    </div>
  )
}
