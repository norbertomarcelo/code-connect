import { describe, expect, it } from 'vitest'
import { AppShell } from '../../components/templates/AppShell'
import { checkAccessibility } from '../../test/a11y'
import { renderWithAuth } from '../../test/renderWithAuth'
import { AboutPage } from './AboutPage'

describe('AboutPage accessibility', () => {
  it('has no WCAG 2.1 AA violations inside the app shell', async () => {
    const { container } = renderWithAuth(
      <AppShell>
        <AboutPage />
      </AppShell>,
    )

    const results = await checkAccessibility(container)

    expect(results).toHaveNoAccessibilityViolations()
  })
})
