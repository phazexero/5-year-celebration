import { motion, type Variants } from 'motion/react'
import type { GalleryItem } from '../lib/gallery'
import { GalleryPhoto } from './GalleryPhoto'

/** stable pseudo random rotation in degrees, so photos don't jump on re-render */
export function tiltFor(year: number, index: number): number {
  const x = Math.sin(year * 97.13 + index * 12.9898) * 43758.5453
  return ((x - Math.floor(x)) * 2 - 1) * 4.5
}

export const polaroidItem: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.92 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 120, damping: 16 } },
}

type Props = { item: GalleryItem; index: number; onOpen: () => void }

export function Polaroid({ item, index, onOpen }: Props) {
  const tilt = tiltFor(item.year, index)
  return (
    <motion.li variants={polaroidItem} className="list-none">
      <motion.button
        type="button"
        onClick={onOpen}
        aria-label={`Open photo ${index + 1}: ${item.caption || 'untitled'}`}
        className="group block w-full cursor-zoom-in rounded-sm bg-white p-3 pb-4 text-left shadow-[0_10px_30px_-12px_rgb(60_30_20/0.45)]"
        style={{ rotate: tilt }}
        whileHover={{ y: -10, rotate: tilt * 0.3, scale: 1.04, boxShadow: '0 26px 50px -18px rgb(60 30 20 / 0.55)' }}
        whileFocus={{ y: -10, rotate: tilt * 0.3, scale: 1.04 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      >
        <GalleryPhoto source={item.source} alt={item.caption} label={`Photo ${index + 1}`} className="aspect-square w-full" />
        <p className="font-display mt-3 line-clamp-2 min-h-[2.6em] text-[15px] leading-snug italic text-neutral-700">
          {item.caption}
        </p>
      </motion.button>
    </motion.li>
  )
}
