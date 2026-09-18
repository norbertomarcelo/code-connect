import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

/** Splits `/feed?q=x` into the pieces a MemoryRouter entry wants. */
export function toLocationEntry(route: string, state?: unknown) {
  const [pathname, search = ''] = route.split('?')
  return { pathname, search: search ? `?${search}` : '', state }
}

/**
 * Renders a component that needs React Router context (e.g. it renders a
 * `Link`), wrapped in a `MemoryRouter`. `route` may carry a query string and
 * `state` seeds `location.state`.
 */
export function renderWithRouter(
  ui: ReactElement,
  { route = '/', state }: { route?: string; state?: unknown } = {},
) {
  return render(
    <MemoryRouter initialEntries={[toLocationEntry(route, state)]}>
      {ui}
    </MemoryRouter>,
  )
}
