import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AppShell } from '../../components/templates/AppShell'
import { listComments } from '../../lib/api/comments'
import { getPost } from '../../lib/api/posts'
import { checkAccessibility } from '../../test/a11y'
import { makeComment, makePostDetail, makeThread } from '../../test/fixtures'
import { renderWithAuth } from '../../test/renderWithAuth'
import { PostPage } from './PostPage'

vi.mock('../../lib/api/posts', () => ({
  getPost: vi.fn(),
  likePost: vi.fn(),
  unlikePost: vi.fn(),
}))
vi.mock('../../lib/api/comments', () => ({
  listComments: vi.fn(),
  createComment: vi.fn(),
}))

describe('PostPage accessibility', () => {
  beforeEach(() => {
    vi.mocked(getPost).mockReset().mockResolvedValue(makePostDetail())
    vi.mocked(listComments)
      .mockReset()
      .mockResolvedValue([
        makeThread({
          id: 'c1',
          replies: [makeComment({ id: 'r1', parentId: 'c1' })],
        }),
      ])
  })

  it('has no WCAG 2.1 AA violations for a visitor', async () => {
    const { container } = renderWithAuth(
      <AppShell>
        <Routes>
          <Route path="/publicacoes/:id" element={<PostPage />} />
        </Routes>
      </AppShell>,
      { route: '/publicacoes/post-1' },
    )
    await screen.findByText(/Achei muito bom seu código/)

    const results = await checkAccessibility(container)

    expect(results).toHaveNoAccessibilityViolations()
  })

  it('has no WCAG 2.1 AA violations for a signed-in user', async () => {
    const { container } = renderWithAuth(
      <AppShell>
        <Routes>
          <Route path="/publicacoes/:id" element={<PostPage />} />
        </Routes>
      </AppShell>,
      {
        route: '/publicacoes/post-1',
        auth: {
          status: 'authenticated',
          user: { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' },
        },
      },
    )
    await screen.findByText(/Achei muito bom seu código/)

    const results = await checkAccessibility(container)

    expect(results).toHaveNoAccessibilityViolations()
  })
})
