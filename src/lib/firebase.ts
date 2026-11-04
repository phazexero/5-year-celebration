import { initializeApp, type FirebaseOptions } from 'firebase/app'
import { connectAuthEmulator, getAuth, signInAnonymously, type Auth } from 'firebase/auth'
import { connectDatabaseEmulator, getDatabase, type Database } from 'firebase/database'

const env = import.meta.env

/** VITE_USE_FIREBASE_EMULATOR=1 talks to local emulators instead of the real project */
export const usingEmulator = env.VITE_USE_FIREBASE_EMULATOR === '1'

const EMULATOR_PROJECT = 'demo-anniversary'

function options(): FirebaseOptions {
  if (usingEmulator) {
    const host = window.location.hostname
    return {
      apiKey: 'demo-key',
      authDomain: `${EMULATOR_PROJECT}.firebaseapp.com`,
      projectId: EMULATOR_PROJECT,
      databaseURL: `http://${host}:9000?ns=${EMULATOR_PROJECT}`,
      appId: 'demo-app',
    }
  }
  return {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: env.VITE_FIREBASE_DATABASE_URL,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
}

export function isFirebaseConfigured(): boolean {
  if (usingEmulator) return true
  return Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_DATABASE_URL && env.VITE_FIREBASE_PROJECT_ID)
}

export class FirebaseSetupError extends Error {}

export type FirebaseSession = { db: Database; uid: string }

let session: Promise<FirebaseSession> | null = null
let cached: { auth: Auth; db: Database } | null = null

/** initialises the app once, even if connecting has to be retried */
function services() {
  if (cached) return cached
  const app = initializeApp(options())
  const auth = getAuth(app)
  const db = getDatabase(app)
  if (usingEmulator) {
    const host = window.location.hostname
    connectAuthEmulator(auth, `http://${host}:9099`, { disableWarnings: true })
    connectDatabaseEmulator(db, host, 9000)
  }
  cached = { auth, db }
  return cached
}

function withTimeout<T>(p: Promise<T>, ms: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const id = window.setTimeout(() => reject(new Error(message)), ms)
    p.then(
      (v) => {
        window.clearTimeout(id)
        resolve(v)
      },
      (e) => {
        window.clearTimeout(id)
        reject(e)
      },
    )
  })
}

async function start(): Promise<FirebaseSession> {
  if (!isFirebaseConfigured()) {
    throw new FirebaseSetupError(
      'Firebase is not configured. Add the VITE_FIREBASE_* variables to .env.local (and to Vercel), then restart or redeploy.',
    )
  }
  const { auth, db } = services()

  // the anonymous user is persisted in the browser, so a refresh keeps the same uid
  await withTimeout(auth.authStateReady(), 15000, 'Timed out while checking sign in.')
  let uid = auth.currentUser?.uid
  if (!uid) {
    const cred = await withTimeout(signInAnonymously(auth), 15000, 'Timed out while signing in.')
    uid = cred.user.uid
  }
  return { db, uid }
}

/** connects once and signs in anonymously; later calls share the same session */
export function connectFirebase(): Promise<FirebaseSession> {
  if (!session) {
    session = start().catch((e) => {
      session = null // allow a retry
      throw e
    })
  }
  return session
}
