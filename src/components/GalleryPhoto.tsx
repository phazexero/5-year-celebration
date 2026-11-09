import { usePhotoSrc, type PhotoSource } from '../lib/gallery'
import { PhotoImage } from './PhotoImage'

type Props = { source: PhotoSource; alt: string; accent?: string; label?: string; className?: string; eager?: boolean }

/** shows a static photo or one uploaded through the site */
export function GalleryPhoto({ source, ...rest }: Props) {
  const { src, failed } = usePhotoSrc(source)
  if (!src && !failed) {
    return (
      <div
        className={`animate-pulse ${rest.className ?? ''}`}
        style={{ backgroundColor: `color-mix(in oklab, ${rest.accent ?? 'var(--accent)'} 18%, white)` }}
        aria-label={rest.alt}
        role="img"
      />
    )
  }
  return <PhotoImage key={src} src={failed ? '/__missing__' : src} {...rest} />
}
