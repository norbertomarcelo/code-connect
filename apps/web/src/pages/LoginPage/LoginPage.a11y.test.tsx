import { describe, expect, it } from 'vitest'
import { checkAccessibility } from '../../test/a11y'
import { renderWithRouter } from '../../test/renderWithRouter'
import { LoginPage } from './LoginPage'

describe('LoginPage accessibility', () => {
  it('has no WCAG 2.1 AA violations', async () => {
    const { container } = renderWithRouter(<LoginPage />)

    const results = await checkAccessibility(container)

    expect(results).toHaveNoAccessibilityViolations()
  })
})
