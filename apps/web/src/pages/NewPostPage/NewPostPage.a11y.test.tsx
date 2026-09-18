import { describe, expect, it, vi } from 'vitest'
import { AppShell } from '../../components/templates/AppShell'
import { checkAccessibility } from '../../test/a11y'
import { renderWithAuth } from '../../test/renderWithAuth'
import { NewPostPage } from './NewPostPage'

vi.mock('../../lib/api/posts', () => ({ createPost: vi.fn() }))

describe('NewPostPage accessibility', () => {
  it('has no WCAG 2.1 AA violations inside the app shell', async () => {
    const { container } = renderWithAuth(
      <AppShell>
        <NewPostPage />
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
