import { describe, expect, it } from 'vitest'
import { checkAccessibility } from '../../test/a11y'
import { renderWithAuth } from '../../test/renderWithAuth'
import { HomePage } from './HomePage'

describe('HomePage accessibility', () => {
  it('has no WCAG 2.1 AA violations', async () => {
    const { container } = renderWithAuth(<HomePage />, {
      auth: {
        user: { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' },
        status: 'authenticated',
      },
    })

    const results = await checkAccessibility(container)

    expect(results).toHaveNoAccessibilityViolations()
  })
})
