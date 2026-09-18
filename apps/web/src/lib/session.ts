import type { AuthUser } from './api/types'

const STORAGE_KEY = 'code-connect.session'
/** Stop trusting a token slightly before it dies so it can't expire mid-flight. */
const EXPIRY_SKEW_MS = 5_000

export interface StoredSession {
  accessToken: string
  expiresAt: string
  user: AuthUser
}

type Listener = () => void

const listeners = new Set<Listener>()
/** Fallback used only when the browser refuses storage (private mode, quota). */
let memorySession: StoredSession | null = null
let storageWritable = true

function storages(): Storage[] {
  try {
    return [window.localStorage, window.sessionStorage]
  } catch {
    return []
  }
}

function notify() {
  for (const listener of [...listeners]) listener()
}

function isStoredSession(value: unknown): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false
  const candidate = value as Partial<StoredSession>
  return (
    typeof candidate.accessToken === 'string' &&
    typeof candidate.expiresAt === 'string' &&
    typeof candidate.user?.id === 'string' &&
    typeof candidate.user?.name === 'string' &&
    typeof candidate.user?.email === 'string'
  )
}

export function isExpired(expiresAt: string): boolean {
  const timestamp = Date.parse(expiresAt)
  return Number.isNaN(timestamp) || timestamp - EXPIRY_SKEW_MS <= Date.now()
}

/** Reads storage on every call: no cache to invalidate, and tests stay honest. */
export function readSession(): StoredSession | null {
  for (const storage of storages()) {
    let raw: string | null = null
    try {
      raw = storage.getItem(STORAGE_KEY)
    } catch {
      continue
    }
    if (raw === null) continue

    try {
      const parsed: unknown = JSON.parse(raw)
      if (isStoredSession(parsed) && !isExpired(parsed.expiresAt)) return parsed
    } catch {
      // Corrupt entry: fall through and drop it.
    }

    try {
      storage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing else to do.
    }
  }

  if (!storageWritable && memorySession && !isExpired(memorySession.expiresAt)) {
    return memorySession
  }
  return null
}

/** `remember` comes from the "Lembrar-me" checkbox. */
export function saveSession(session: StoredSession, remember: boolean): void {
  memorySession = session
  try {
    const target = remember ? window.localStorage : window.sessionStorage
    const other = remember ? window.sessionStorage : window.localStorage
    other.removeItem(STORAGE_KEY)
    target.setItem(STORAGE_KEY, JSON.stringify(session))
    storageWritable = true
  } catch {
    // Private mode or quota: the session lives in memory for this tab only.
    storageWritable = false
  }
  notify()
}

export function clearSession(): void {
  memorySession = null
  for (const storage of storages()) {
    try {
      storage.removeItem(STORAGE_KEY)
    } catch {
      // Nothing else to do.
    }
  }
  notify()
}

export function getAccessToken(): string | null {
  return readSession()?.accessToken ?? null
}

export function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
