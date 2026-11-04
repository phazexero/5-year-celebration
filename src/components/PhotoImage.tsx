import { useState } from 'react'
import { Heart } from './Icons'

type Props = {
  src: string
  alt: string
  /** accent colour for the placeholder tile */
  accent?: string
  label?: string
  className?: string
  eager?: boolean
}

/** <img> that falls back to a themed placeholder tile when the photo isn't there yet */
export function PhotoImage({ src, alt, accent = 'var(--accent)', label, className = '', eager }: Props) {
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  if (failed) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center gap-2 text-white/90 ${className}`}
        style={{
          background: `linear-gradient(135deg, color-mix(in oklab, ${accent} 70%, white), ${accent})`,
        }}
      >
        <Heart size={34} />
        {label && <span className="font-display text-sm italic opacity-90">{label}</span>}
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      draggable={false}
      onLoad={() => setLoaded(true)}
      onError={() => setFailed(true)}
      className={`object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
      style={{ backgroundColor: `color-mix(in oklab, ${accent} 15%, white)` }}
    />
  )
}
