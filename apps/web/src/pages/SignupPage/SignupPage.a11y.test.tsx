import { describe, expect, it } from 'vitest'
import { checkAccessibility } from '../../test/a11y'
import { renderWithAuth } from '../../test/renderWithAuth'
import { SignupPage } from './SignupPage'

describe('SignupPage accessibility', () => {
  it('has no WCAG 2.1 AA violations', async () => {
    const { container } = renderWithAuth(<SignupPage />)

    const results = await checkAccessibility(container)

    expect(results).toHaveNoAccessibilityViolations()
  })
})
