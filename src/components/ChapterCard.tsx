import { motion } from 'motion/react'
import { Link } from 'react-router-dom'
import type { YearInfo } from '../content/config'
import { useYearItems } from '../lib/gallery'
import { GalleryPhoto } from './GalleryPhoto'

export function ChapterCard({ year, info, index }: { year: number; info: YearInfo; index: number }) {
  const cover = useYearItems(year).items[0]
  const { background, accent, text } = info.theme
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 110, damping: 18 }}
    >
      <Link
        to={`/year/${year}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl p-5 shadow-[0_18px_40px_-26px_rgb(60_30_20/0.6)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_28px_50px_-24px_rgb(60_30_20/0.6)]"
        style={{ background, color: text, ['--accent' as string]: accent }}
      >
        <div className="relative mb-5 aspect-[4/3] overflow-hidden rounded-xl">
          {cover ? (
            <GalleryPhoto
              source={cover.source}
              alt={cover.caption}
              accent={accent}
              label={`Year ${year}`}
              className="h-full w-full transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{ background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 65%, white), ${accent})` }}
            />
          )}
          <span
            className="font-display absolute top-3 left-3 rounded-full px-3 py-1 text-sm font-semibold text-white shadow"
            style={{ background: `color-mix(in oklab, ${accent} 80%, black)` }}
          >
            {String(year).padStart(2, '0')}
          </span>
        </div>
        <h3 className="font-display text-xl leading-tight font-semibold">{info.title}</h3>
        <p className="mt-1.5 text-sm opacity-75">{info.subtitle}</p>
        <span
          className="mt-auto pt-4 text-sm font-semibold"
          style={{ color: `color-mix(in oklab, ${accent} 70%, black)` }}
        >
          Open chapter <span className="inline-block transition group-hover:translate-x-1">→</span>
        </span>
      </Link>
    </motion.div>
  )
}
