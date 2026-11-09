import { Component, type ReactNode } from 'react'
import { ErrorScreen } from './ErrorScreen'

type State = { error: Error | null }

/** last line of defence: a friendly screen instead of a blank page */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  render() {
    const { error } = this.state
    if (!error) return this.props.children
    // after a redeploy, an open tab may ask for a file that no longer exists: a reload fixes it
    const stale = /dynamically imported module|Failed to fetch|Importing a module script failed/i.test(error.message)
    return (
      <ErrorScreen
        title={stale ? 'A newer version is available' : 'Something went wrong'}
        message={
          stale
            ? 'The site was updated while this tab was open. Reload to get the latest version.'
            : 'Sorry about that. Reloading usually fixes it.'
        }
        detail={stale ? undefined : error.message}
        onRetry={() => window.location.reload()}
      />
    )
  }
}
