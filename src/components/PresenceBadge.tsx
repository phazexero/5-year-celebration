import { motion } from 'motion/react'
import { nameOf, type Role } from '../content/config'
import type { Player } from '../lib/room'
import { timeAgo } from '../lib/room'
import { useNow } from '../lib/time'

type Props = { role: Role; player?: Player; isYou?: boolean; size?: 'sm' | 'lg' }

export function PresenceBadge({ role, player, isYou, size = 'lg' }: Props) {
  useNow(30000) // keep "last seen" fresh
  const online = !!player?.online
  const name = nameOf(role)
  const big = size === 'lg'
  return (
    <div className={`flex items-center ${big ? 'gap-3' : 'gap-2'}`}>
      <div className="relative">
        <div
          className={`font-display flex items-center justify-center rounded-full font-semibold text-white ${
            big ? 'h-12 w-12 text-xl' : 'h-8 w-8 text-sm'
          }`}
          style={{ background: role === 'me' ? '#7a2e2a' : 'var(--accent)' }}
          aria-hidden
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <span
          className={`absolute -right-0.5 -bottom-0.5 rounded-full border-2 border-white ${big ? 'h-4 w-4' : 'h-3 w-3'} ${
            online ? 'bg-emerald-500' : 'bg-neutral-300'
          }`}
        >
          {online && (
            <motion.span
              className="absolute inset-0 rounded-full bg-emerald-500"
              animate={{ scale: [1, 2.2], opacity: [0.6, 0] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
          )}
        </span>
      </div>
      <div className="leading-tight">
        <div className={`font-semibold ${big ? '' : 'text-sm'}`}>
          {name}
          {isYou && <span className="ml-1.5 text-xs font-medium text-[var(--color-ink-soft)]">(you)</span>}
        </div>
        <div className={`text-[var(--color-ink-soft)] ${big ? 'text-sm' : 'text-xs'}`} aria-live="polite">
          {online ? 'online' : `offline · ${timeAgo(player?.lastSeen)}`}
        </div>
      </div>
    </div>
  )
}
