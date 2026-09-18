import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { AuthContext } from '../auth/AuthContext'
import type { AuthContextValue } from '../auth/AuthContext'
import { toLocationEntry } from './renderWithRouter'

const anonymousAuth: AuthContextValue = {
  user: null,
  status: 'anonymous',
  signIn: async () => {},
  signUp: async () => ({
    id: 'user-1',
    name: 'Ana Silva',
    email: 'ana@example.com',
  }),
  signOut: () => {},
}

interface RenderWithAuthOptions {
  route?: string
  state?: unknown
  auth?: Partial<AuthContextValue>
}

/**
 * Renders a page with a stubbed auth context (and a router), so page tests
 * never touch the API. Pass `auth` to override the pieces under test.
 */
export function renderWithAuth(
  ui: ReactElement,
  { route = '/', state, auth }: RenderWithAuthOptions = {},
) {
  const value: AuthContextValue = { ...anonymousAuth, ...auth }

  return {
    ...render(
      <MemoryRouter initialEntries={[toLocationEntry(route, state)]}>
        <AuthContext.Provider value={value}>{ui}</AuthContext.Provider>
      </MemoryRouter>,
    ),
    auth: value,
  }
}
