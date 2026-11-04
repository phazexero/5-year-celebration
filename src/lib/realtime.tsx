import type { Database } from 'firebase/database'
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { otherRole, type Role } from '../content/config'
import { ErrorScreen } from '../components/ErrorScreen'
import { PageLoader } from '../components/PageLoader'
import { connectFirebase, FirebaseSetupError } from './firebase'
import { loadRole, saveRole, useConnected, usePresence, useRoomValue, type Players } from './room'

type Realtime = {
  db: Database
  uid: string
  /** who this browser is playing as (null until picked) */
  role: Role | null
  setRole: (role: Role | null) => void
  players: Players
  playersLoaded: boolean
  /** this browser's live connection to the database */
  connected: boolean
  partnerOnline: boolean
  bothOnline: boolean
  takenOver: boolean
  reclaim: () => void
}

const Ctx = createContext<Realtime | null>(null)

export function useRealtime(): Realtime {
  const v = useContext(Ctx)
  if (!v) throw new Error('useRealtime must be used inside <RealtimeProvider>')
  return v
}

/** connects to Firebase, signs in anonymously and keeps this player's presence up to date */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<{ db: Database; uid: string } | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setError(null)
    connectFirebase()
      .then((s) => !cancelled && setSession(s))
      .catch((e: Error) => !cancelled && setError(e))
    return () => {
      cancelled = true
    }
  }, [attempt])

  if (error) {
    return (
      <ErrorScreen
        title={error instanceof FirebaseSetupError ? 'Games are not set up yet' : "Couldn't reach the game server"}
        message={
          error instanceof FirebaseSetupError
            ? error.message
            : 'Check your internet connection and try again. If it keeps happening, the Firebase settings may be wrong.'
        }
        detail={error instanceof FirebaseSetupError ? undefined : error.message}
        onRetry={error instanceof FirebaseSetupError ? undefined : () => setAttempt((n) => n + 1)}
      />
    )
  }
  if (!session) return <PageLoader label="Connecting" />
  return <Connected db={session.db} uid={session.uid}>{children}</Connected>
}

function Connected({ db, uid, children }: { db: Database; uid: string; children: ReactNode }) {
  const [role, setRoleState] = useState<Role | null>(loadRole)
  const setRole = useCallback((r: Role | null) => {
    saveRole(r)
    setRoleState(r)
  }, [])
  const { takenOver, reclaim } = usePresence(db, uid, role)
  const { value, loaded, error } = useRoomValue<Players>(db, 'players')
  const connected = useConnected(db)

  const value_ = useMemo<Realtime>(() => {
    const players = value ?? {}
    const partnerOnline = role ? !!players[otherRole(role)]?.online : false
    const meOnline = role ? !!players[role]?.online && players[role]?.uid === uid : false
    return {
      db,
      uid,
      role,
      setRole,
      players,
      playersLoaded: loaded,
      connected,
      partnerOnline,
      bothOnline: meOnline && partnerOnline && !takenOver,
      takenOver,
      reclaim,
    }
  }, [db, uid, role, setRole, value, loaded, connected, takenOver, reclaim])

  if (error) {
    return (
      <ErrorScreen
        title="The game server said no"
        message="Reading the room was refused. Make sure the rules from database.rules.json are published in Firebase and Anonymous sign in is enabled."
        detail={error.message}
        onRetry={() => window.location.reload()}
      />
    )
  }
  return <Ctx.Provider value={value_}>{children}</Ctx.Provider>
}
