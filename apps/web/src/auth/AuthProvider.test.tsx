import { render, screen, waitFor } from '@testing-library/react'
import { useState } from 'react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../lib/api/errors'
import { getCurrentUser, login } from '../lib/api/auth'
import { saveSession } from '../lib/session'
import { AuthProvider } from './AuthProvider'
import { useAuth } from './useAuth'

vi.mock('../lib/api/auth', () => ({ login: vi.fn(), getCurrentUser: vi.fn() }))
vi.mock('../lib/api/users', () => ({ createUser: vi.fn() }))

const KEY = 'code-connect.session'
const ana = { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' }

function makeSession() {
  return {
    accessToken: 'token-123',
    expiresAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    user: ana,
  }
}

function Probe() {
  const { status, user, signIn, signOut } = useAuth()
  const [error, setError] = useState('')
  return (
    <div>
      <p data-testid="status">{status}</p>
      <p data-testid="name">{user?.name ?? 'none'}</p>
      <p data-testid="error">{error}</p>
      <button
        onClick={() =>
          signIn({
            email: ana.email,
            password: 'secret-123',
            remember: false,
          }).catch((caught: unknown) =>
            setError(caught instanceof Error ? caught.message : 'unknown'),
          )
        }
      >
        remember off
      </button>
      <button
        onClick={() =>
          signIn({ email: ana.email, password: 'secret-123', remember: true })
        }
      >
        remember on
      </button>
      <button onClick={signOut}>sign out</button>
    </div>
  )
}

function renderProvider() {
  return render(
    <AuthProvider>
      <Probe />
    </AuthProvider>,
  )
}

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(login).mockReset()
  })

  it('is anonymous without a stored session and never calls the API', async () => {
    renderProvider()

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous'),
    )
    expect(getCurrentUser).not.toHaveBeenCalled()
  })

  it('validates a stored session with /auth/me', async () => {
    saveSession(makeSession(), true)
    vi.mocked(getCurrentUser).mockResolvedValue(ana)

    renderProvider()

    expect(screen.getByTestId('status')).toHaveTextContent('loading')
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    )
    expect(screen.getByTestId('name')).toHaveTextContent('Ana Silva')
  })

  it('clears the session when /auth/me rejects', async () => {
    saveSession(makeSession(), true)
    vi.mocked(getCurrentUser).mockRejectedValue(
      new ApiError('unauthorized', 401, ['Unauthorized']),
    )

    renderProvider()

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('anonymous'),
    )
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('stores the session in localStorage when remember is on', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockResolvedValue(makeSession())
    renderProvider()

    await user.click(screen.getByRole('button', { name: 'remember on' }))

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    )
    expect(localStorage.getItem(KEY)).not.toBeNull()
    expect(sessionStorage.getItem(KEY)).toBeNull()
  })

  it('stores the session in sessionStorage when remember is off', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockResolvedValue(makeSession())
    renderProvider()

    await user.click(screen.getByRole('button', { name: 'remember off' }))

    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    )
    expect(sessionStorage.getItem(KEY)).not.toBeNull()
    expect(localStorage.getItem(KEY)).toBeNull()
  })

  it('rethrows login failures without changing status', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockRejectedValue(
      new ApiError('unauthorized', 401, ['Invalid credentials']),
    )
    renderProvider()

    await user.click(screen.getByRole('button', { name: 'remember off' }))

    await waitFor(() =>
      expect(screen.getByTestId('error')).toHaveTextContent('Invalid credentials'),
    )
    expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
  })

  it('signs out by clearing the session', async () => {
    const user = userEvent.setup()
    vi.mocked(login).mockResolvedValue(makeSession())
    renderProvider()
    await user.click(screen.getByRole('button', { name: 'remember on' }))
    await waitFor(() =>
      expect(screen.getByTestId('status')).toHaveTextContent('authenticated'),
    )

    await user.click(screen.getByRole('button', { name: 'sign out' }))

    expect(screen.getByTestId('status')).toHaveTextContent('anonymous')
    expect(localStorage.getItem(KEY)).toBeNull()
  })
})
