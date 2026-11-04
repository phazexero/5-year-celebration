import { Link } from 'react-router-dom'

type Props = { title: string; message: string; detail?: string; onRetry?: () => void }

export function ErrorScreen({ title, message, detail, onRetry }: Props) {
  return (
    <main className="paper flex min-h-screen items-center justify-center p-6" role="alert">
      <div className="card w-full max-w-lg p-8 text-center sm:p-10">
        <div className="font-display mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[color-mix(in_oklab,var(--accent)_15%,white)] text-2xl text-[var(--accent)]">
          !
        </div>
        <h1 className="font-display text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-[var(--color-ink-soft)]">{message}</p>
        {detail && (
          <details className="mt-5 text-left text-xs text-[var(--color-ink-soft)]">
            <summary className="cursor-pointer">Technical details</summary>
            <pre className="mt-2 overflow-auto rounded-lg bg-black/5 p-3 whitespace-pre-wrap">{detail}</pre>
          </details>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {onRetry && (
            <button type="button" className="btn" onClick={onRetry}>
              Try again
            </button>
          )}
          <Link to="/" className="btn btn-ghost">
            Back to the gallery
          </Link>
        </div>
      </div>
    </main>
  )
}
