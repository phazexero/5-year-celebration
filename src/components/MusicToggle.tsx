import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Music } from './Icons'

const SRC = '/music.mp3'
const VOLUME = 0.35

/**
 * Soft background music, off by default. Drop a file at public/music.mp3 to enable;
 * without it the button never appears.
 */
export function MusicToggle() {
  const [available, setAvailable] = useState(false)
  const [playing, setPlaying] = useState(false)
  const audio = useRef<HTMLAudioElement | null>(null)
  const fade = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    // SPA hosts answer every path with index.html, so check that it's really audio
    fetch(SRC, { method: 'HEAD' })
      .then((r) => {
        const type = r.headers.get('content-type') ?? ''
        if (!cancelled && r.ok && type.startsWith('audio')) setAvailable(true)
      })
      .catch(() => {})
    return () => {
      cancelled = true
      if (fade.current) window.clearInterval(fade.current)
      audio.current?.pause()
    }
  }, [])

  const rampTo = (target: number, done?: () => void) => {
    const a = audio.current
    if (!a) return
    if (fade.current) window.clearInterval(fade.current)
    fade.current = window.setInterval(() => {
      const step = 0.03
      const v = a.volume + (target > a.volume ? step : -step)
      if (Math.abs(target - a.volume) <= step) {
        a.volume = target
        if (fade.current) window.clearInterval(fade.current)
        fade.current = null
        done?.()
      } else a.volume = Math.min(1, Math.max(0, v))
    }, 60)
  }

  const toggle = async () => {
    if (!audio.current) {
      audio.current = new Audio(SRC)
      audio.current.loop = true
      audio.current.volume = 0
    }
    const a = audio.current
    if (playing) {
      setPlaying(false)
      rampTo(0, () => a.pause())
    } else {
      try {
        a.volume = 0
        await a.play()
        setPlaying(true)
        rampTo(VOLUME)
      } catch {
        setPlaying(false)
      }
    }
  }

  return (
    <AnimatePresence>
      {available && (
        <motion.button
          type="button"
          onClick={toggle}
          aria-pressed={playing}
          aria-label={playing ? 'Pause music' : 'Play music'}
          title={playing ? 'Pause music' : 'Play music'}
          className="fixed bottom-5 left-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-[var(--color-ink)] shadow-lg backdrop-blur transition hover:scale-105"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
        >
          <Music size={20} off={!playing} />
          {playing && (
            <motion.span
              className="absolute inset-0 rounded-full border-2 border-[var(--color-rose)]"
              animate={{ scale: [1, 1.35], opacity: [0.5, 0] }}
              transition={{ duration: 1.8, repeat: Infinity }}
              aria-hidden
            />
          )}
        </motion.button>
      )}
    </AnimatePresence>
  )
}
