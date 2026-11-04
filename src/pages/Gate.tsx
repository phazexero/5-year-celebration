import { motion, useAnimationControls } from 'motion/react'
import { useState, type FormEvent, type ReactNode } from 'react'
import { config } from '../content/config'
import { Heart } from '../components/Icons'
import { sha256Hex } from '../lib/sha256'

const STORAGE_KEY = 'anniv-unlocked'
/** dev only fallback so `npm run dev` works before .env.local exists: password is "letmein" */
const DEV_FALLBACK_HASH = '1c8bfe8f801d79745c4631d09fff36c82aa37fc4cce4fc946683d7b336b63032'

const envHash = (import.meta.env.VITE_SITE_PASSWORD_HASH ?? '').trim().toLowerCase()
const expectedHash = envHash || (import.meta.env.DEV ? DEV_FALLBACK_HASH : '')

function readUnlocked(): boolean {
  try {
    return !!expectedHash && localStorage.getItem(STORAGE_KEY) === expectedHash
  } catch {
    return false
  }
}

export function Gate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(readUnlocked)
  const [value, setValue] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const shake = useAnimationControls()

  if (unlocked) return <>{children}</>

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!value || busy) return
    setBusy(true)
    const hash = await sha256Hex(value)
    setBusy(false)
    if (hash === expectedHash) {
      try {
        localStorage.setItem(STORAGE_KEY, hash)
      } catch {
        /* private mode: she'll just be asked again next time */
      }
      setUnlocked(true)
    } else {
      setError(config.copy.gateWrong)
      setValue('')
      shake.start({ x: [0, -12, 12, -8, 8, -3, 0], transition: { duration: 0.45 } })
    }
  }

  return (
    <main className="paper flex min-h-screen items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="card w-full max-w-md px-8 py-10 text-center sm:px-10"
      >
        <motion.div
          className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full text-white"
          style={{ background: 'var(--accent)' }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <Heart size={30} />
        </motion.div>
        <h1 className="font-display text-4xl font-semibold">{config.copy.gateTitle}</h1>
        <p className="mt-3 text-sm text-[var(--color-ink-soft)]">{config.copy.gateHint}</p>

        {!expectedHash ? (
          <p className="mt-8 rounded-lg bg-amber-50 p-4 text-left text-sm text-amber-900">
            This site isn't configured yet: set <code>VITE_SITE_PASSWORD_HASH</code> in the environment variables
            and redeploy.
          </p>
        ) : (
          <motion.form animate={shake} onSubmit={submit} className="mt-8 flex flex-col gap-3">
            <label htmlFor="pw" className="sr-only">
              Password
            </label>
            <input
              id="pw"
              type="password"
              autoFocus
              autoComplete="current-password"
              value={value}
              onChange={(e) => {
                setValue(e.target.value)
                setError('')
              }}
              placeholder="Password"
              className="rounded-full border border-black/10 bg-white px-5 py-3 text-center text-lg outline-none transition focus:border-[var(--accent)] focus:ring-4 focus:ring-[color-mix(in_oklab,var(--accent)_20%,transparent)]"
            />
            <button type="submit" className="btn" disabled={!value || busy}>
              {busy ? 'Checking…' : 'Come in'}
            </button>
            <p role="alert" className="min-h-5 text-sm text-[var(--accent)]">
              {error}
            </p>
            {import.meta.env.DEV && !envHash && (
              <p className="text-xs text-[var(--color-ink-soft)]">
                Dev mode without VITE_SITE_PASSWORD_HASH: the password is <code>letmein</code>
              </p>
            )}
          </motion.form>
        )}
      </motion.div>
    </main>
  )
}
