import { BackLink } from '../components/BackLink'
import { config } from '../content/config'

export default function Play() {
  return (
    <main className="paper min-h-screen">
      <nav className="mx-auto max-w-6xl px-6 pt-6">
        <BackLink />
      </nav>
      <div className="mx-auto max-w-3xl px-6 pt-20 text-center">
        <h1 className="font-display text-5xl font-semibold">{config.copy.playTitle}</h1>
        <p className="mt-4 text-[var(--color-ink-soft)]">Games are coming in the next phase.</p>
      </div>
    </main>
  )
}
