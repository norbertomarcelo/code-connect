import { render } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'

/**
 * Renders a component that needs React Router context (e.g. it renders a
 * `Link`), wrapped in a `MemoryRouter`.
 */
export function renderWithRouter(ui: ReactElement, { route = '/' } = {}) {
  return render(<MemoryRouter initialEntries={[route]}>{ui}</MemoryRouter>)
}
