import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

/**
 * Renders a component that needs React Router context (e.g. it renders a
 * `Link`), wrapped in a `MemoryRouter`. `state` seeds `location.state`.
 */
export function renderWithRouter(
  ui: ReactElement,
  { route = '/', state }: { route?: string; state?: unknown } = {},
) {
  return render(
    <MemoryRouter initialEntries={[{ pathname: route, state }]}>{ui}</MemoryRouter>,
  )
}
