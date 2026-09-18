import { describe, expect, it } from 'vitest'
import { AppShell } from '../../components/templates/AppShell'
import { checkAccessibility } from '../../test/a11y'
import { renderWithAuth } from '../../test/renderWithAuth'
import { ProfilePage } from './ProfilePage'

describe('ProfilePage accessibility', () => {
  it('has no WCAG 2.1 AA violations inside the app shell', async () => {
    const { container } = renderWithAuth(
      <AppShell>
        <ProfilePage />
      </AppShell>,
      {
        auth: {
          status: 'authenticated',
          user: { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' },
        },
      },
    )

    const results = await checkAccessibility(container)

    expect(results).toHaveNoAccessibilityViolations()
  })
})
