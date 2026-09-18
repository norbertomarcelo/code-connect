import { screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from '../../components/templates/AppShell'
import { listPosts } from '../../lib/api/posts'
import { listTags } from '../../lib/api/tags'
import { checkAccessibility } from '../../test/a11y'
import { makePost } from '../../test/fixtures'
import { renderWithAuth } from '../../test/renderWithAuth'
import { FeedPage } from './FeedPage'

vi.mock('../../lib/api/posts', () => ({
  listPosts: vi.fn(),
  likePost: vi.fn(),
  unlikePost: vi.fn(),
}))
vi.mock('../../lib/api/tags', () => ({ listTags: vi.fn() }))

describe('FeedPage accessibility', () => {
  beforeEach(() => {
    vi.mocked(listPosts).mockReset().mockResolvedValue({
      items: [makePost({ id: 'a' }), makePost({ id: 'b', thumbnailUrl: null, tags: [] })],
      page: 1,
      limit: 12,
      total: 2,
      totalPages: 2,
    })
    vi.mocked(listTags)
      .mockReset()
      .mockResolvedValue([{ slug: 'react', label: 'React' }])
  })

  it('has no WCAG 2.1 AA violations inside the app shell', async () => {
    const { container } = renderWithAuth(
      <AppShell>
        <FeedPage />
      </AppShell>,
      { route: '/feed?tags=react' },
    )
    await screen.findAllByRole('article')

    const results = await checkAccessibility(container)

    expect(results).toHaveNoAccessibilityViolations()
  })
})
