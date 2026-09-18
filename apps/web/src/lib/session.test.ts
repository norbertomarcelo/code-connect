import { describe, expect, it, vi } from 'vitest'
import {
  clearSession,
  getAccessToken,
  readSession,
  saveSession,
  subscribe,
} from './session'
import type { StoredSession } from './session'

const KEY = 'code-connect.session'

function makeSession(overrides: Partial<StoredSession> = {}): StoredSession {
  return {
    accessToken: 'token-123',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' },
    ...overrides,
  }
}

describe('session', () => {
  it('stores in localStorage and clears sessionStorage when remembered', () => {
    sessionStorage.setItem(KEY, 'stale')
    saveSession(makeSession(), true)

    expect(localStorage.getItem(KEY)).not.toBeNull()
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('stores in sessionStorage and clears localStorage when not remembered', () => {
    localStorage.setItem(KEY, 'stale')
    saveSession(makeSession(), false)

    expect(sessionStorage.getItem(KEY)).not.toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('reads back a saved session and exposes its token', () => {
    const session = makeSession()
    saveSession(session, true)

    expect(readSession()).toEqual(session)
    expect(getAccessToken()).toBe('token-123')
  })

  it('returns null and purges an expired session', () => {
    localStorage.setItem(
      KEY,
      JSON.stringify(makeSession({ expiresAt: new Date(Date.now() - 1000).toISOString() })),
    )

    expect(readSession()).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('tolerates and purges corrupt JSON', () => {
    localStorage.setItem(KEY, '{not json')

    expect(readSession()).toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('returns null when nothing is stored', () => {
    expect(readSession()).toBeNull()
    expect(getAccessToken()).toBeNull()
  })

  it('clears both storages and notifies subscribers', () => {
    saveSession(makeSession(), true)
    const listener = vi.fn()
    const unsubscribe = subscribe(listener)

    clearSession()

    expect(readSession()).toBeNull()
    expect(listener).toHaveBeenCalledTimes(1)

    unsubscribe()
    clearSession()
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
