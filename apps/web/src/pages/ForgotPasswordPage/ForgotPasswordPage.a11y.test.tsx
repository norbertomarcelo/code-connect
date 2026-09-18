import { describe, expect, it } from 'vitest'
import { checkAccessibility } from '../../test/a11y'
import { renderWithRouter } from '../../test/renderWithRouter'
import { ForgotPasswordPage } from './ForgotPasswordPage'

describe('ForgotPasswordPage accessibility', () => {
  it('has no WCAG 2.1 AA violations', async () => {
    const { container } = renderWithRouter(<ForgotPasswordPage />)

    const results = await checkAccessibility(container)

    expect(results).toHaveNoAccessibilityViolations()
  })
})
