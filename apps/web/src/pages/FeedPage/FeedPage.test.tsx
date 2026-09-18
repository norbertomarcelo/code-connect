import { act, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes, useLocation } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api/errors'
import { likePost, listPosts, unlikePost } from '../../lib/api/posts'
import { listTags } from '../../lib/api/tags'
import type { PaginatedPosts } from '../../lib/api/types'
import { makePost } from '../../test/fixtures'
import { renderWithAuth } from '../../test/renderWithAuth'
import { FeedPage } from './FeedPage'

vi.mock('../../lib/api/posts', () => ({
  listPosts: vi.fn(),
  likePost: vi.fn(),
  unlikePost: vi.fn(),
}))
vi.mock('../../lib/api/tags', () => ({ listTags: vi.fn() }))

const ana = { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' }

function pageOf(overrides: Partial<PaginatedPosts> = {}): PaginatedPosts {
  const items = overrides.items ?? [
    makePost({ id: 'a', title: 'Primeiro post' }),
    makePost({ id: 'b', title: 'Segundo post' }),
  ]
  return { items, page: 1, limit: 12, total: items.length, totalPages: 1, ...overrides }
}

function LocationProbe() {
  const { search } = useLocation()
  return <p data-testid="search">{search}</p>
}

function renderFeed(options: Parameters<typeof renderWithAuth>[1] = {}) {
  return renderWithAuth(
    <>
      <Routes>
        <Route path="/feed" element={<FeedPage />} />
        <Route path="/login" element={<p>tela de login</p>} />
      </Routes>
      <LocationProbe />
    </>,
    { route: '/feed', ...options },
  )
}

describe('FeedPage', () => {
  beforeEach(() => {
    vi.mocked(listPosts).mockReset().mockResolvedValue(pageOf())
    vi.mocked(listTags)
      .mockReset()
      .mockResolvedValue([
        { slug: 'react', label: 'React' },
        { slug: 'css', label: 'CSS' },
      ])
    vi.mocked(likePost).mockReset().mockResolvedValue({
      postId: 'a',
      likeCount: 13,
      viewerHasLiked: true,
    })
    vi.mocked(unlikePost).mockReset().mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('shows a loading status, then the posts', async () => {
    renderFeed()

    expect(screen.getByRole('status')).toHaveTextContent('Carregando publicações...')
    expect(await screen.findByRole('link', { name: 'Primeiro post' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Segundo post' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Feed' })).toBeInTheDocument()
  })

  it('reads the filters from the url and sends them to the api', async () => {
    renderFeed({ route: '/feed?q=hooks&tags=react,css&sort=popular&page=2' })

    await waitFor(() =>
      expect(listPosts).toHaveBeenCalledWith({
        q: 'hooks',
        tags: ['react', 'css'],
        sort: 'popular',
        page: 2,
        limit: 12,
      }),
    )
    expect(screen.getByRole('searchbox')).toHaveValue('hooks')
  })

  it('says so when there are no posts at all', async () => {
    vi.mocked(listPosts).mockResolvedValue(pageOf({ items: [], total: 0, totalPages: 0 }))
    renderFeed()

    expect(await screen.findByText('Nenhuma publicação ainda.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Limpar tudo' })).not.toBeInTheDocument()
  })

  it('offers to clear the filters when they match nothing', async () => {
    const user = userEvent.setup()
    vi.mocked(listPosts).mockResolvedValue(pageOf({ items: [], total: 0, totalPages: 0 }))
    renderFeed({ route: '/feed?q=nada' })

    expect(
      await screen.findByText('Nenhuma publicação encontrada para esses filtros.'),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Limpar tudo' }))

    await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(/^$/))
    expect(screen.getByRole('searchbox')).toHaveValue('')
  })

  it('shows an alert with a retry button when loading fails', async () => {
    const user = userEvent.setup()
    vi.mocked(listPosts).mockRejectedValueOnce(new ApiError('network', null, ['x']))
    renderFeed()

    expect(await screen.findByRole('alert')).toHaveTextContent(/conectar ao servidor/)

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('link', { name: 'Primeiro post' })).toBeInTheDocument()
    expect(listPosts).toHaveBeenCalledTimes(2)
  })

  describe('search', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    it('waits for a pause in typing and then searches once', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime })
      renderFeed()
      await screen.findByRole('link', { name: 'Primeiro post' })

      await user.type(screen.getByRole('searchbox'), 'react')
      await act(() => vi.advanceTimersByTimeAsync(400))

      await waitFor(() =>
        expect(listPosts).toHaveBeenLastCalledWith(expect.objectContaining({ q: 'react' })),
      )
      const searches = vi.mocked(listPosts).mock.calls.filter(([params]) => params?.q)
      expect(searches).toHaveLength(1)
      expect(screen.getByTestId('search')).toHaveTextContent('?q=react')
    })
  })

  describe('tags and order', () => {
    it('filters by a tag, keeps it in the url, and can remove it', async () => {
      const user = userEvent.setup()
      renderFeed()
      await screen.findByRole('link', { name: 'Primeiro post' })

      await user.click(await screen.findByRole('button', { name: 'Filtrar por React' }))

      await waitFor(() =>
        expect(listPosts).toHaveBeenLastCalledWith(expect.objectContaining({ tags: ['react'] })),
      )
      expect(screen.getByTestId('search')).toHaveTextContent('?tags=react')

      await user.click(screen.getByRole('button', { name: 'Remover filtro React' }))

      await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(/^$/))
    })

    it('requires every selected tag by sending them together', async () => {
      const user = userEvent.setup()
      renderFeed({ route: '/feed?tags=react' })
      await screen.findByRole('link', { name: 'Primeiro post' })

      await user.click(await screen.findByRole('button', { name: 'Filtrar por CSS' }))

      await waitFor(() =>
        expect(listPosts).toHaveBeenLastCalledWith(
          expect.objectContaining({ tags: ['react', 'css'] }),
        ),
      )
    })

    it('sorts by popularity and back to recent', async () => {
      const user = userEvent.setup()
      renderFeed()
      await screen.findByRole('link', { name: 'Primeiro post' })

      await user.click(screen.getByRole('button', { name: 'Populares' }))
      await waitFor(() =>
        expect(listPosts).toHaveBeenLastCalledWith(expect.objectContaining({ sort: 'popular' })),
      )
      expect(screen.getByTestId('search')).toHaveTextContent('?sort=popular')

      await user.click(screen.getByRole('button', { name: 'Recentes' }))
      await waitFor(() => expect(screen.getByTestId('search')).toHaveTextContent(/^$/))
    })
  })

  describe('pagination', () => {
    it('moves between pages and resets to the first one when the order changes', async () => {
      const user = userEvent.setup()
      vi.mocked(listPosts).mockResolvedValue(pageOf({ totalPages: 3 }))
      renderFeed()

      expect(await screen.findByText('Página 1 de 3')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled()

      await user.click(screen.getByRole('button', { name: 'Próxima' }))
      await waitFor(() =>
        expect(listPosts).toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 })),
      )
      expect(screen.getByTestId('search')).toHaveTextContent('?page=2')

      await user.click(screen.getByRole('button', { name: 'Populares' }))
      await waitFor(() =>
        expect(listPosts).toHaveBeenLastCalledWith(
          expect.objectContaining({ sort: 'popular', page: 1 }),
        ),
      )
    })

    it('hides the pager when everything fits on one page', async () => {
      renderFeed()
      await screen.findByRole('link', { name: 'Primeiro post' })

      expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument()
    })
  })

  describe('likes', () => {
    it('sends an anonymous visitor to the login page', async () => {
      const user = userEvent.setup()
      renderFeed()
      await screen.findByRole('link', { name: 'Primeiro post' })

      await user.click(screen.getAllByRole('button', { name: /Aprovar/ })[0])

      expect(await screen.findByText('tela de login')).toBeInTheDocument()
      expect(likePost).not.toHaveBeenCalled()
    })

    it('likes right away for a signed-in user and calls the api', async () => {
      const user = userEvent.setup()
      renderFeed({ auth: { status: 'authenticated', user: ana } })
      const card = (await screen.findByRole('link', { name: 'Primeiro post' })).closest('article')!

      await user.click(within(card).getByRole('button', { name: /Aprovar/ }))

      expect(within(card).getByRole('button', { name: /Aprovar/ })).toHaveTextContent('13')
      expect(within(card).getByRole('button', { name: /Aprovar/ })).toHaveAttribute(
        'aria-pressed',
        'true',
      )
      expect(likePost).toHaveBeenCalledWith('a')
    })

    it('unlikes a post the viewer already liked', async () => {
      const user = userEvent.setup()
      vi.mocked(listPosts).mockResolvedValue(
        pageOf({ items: [makePost({ id: 'a', title: 'Primeiro post', viewerHasLiked: true })] }),
      )
      renderFeed({ auth: { status: 'authenticated', user: ana } })
      const card = (await screen.findByRole('link', { name: 'Primeiro post' })).closest('article')!

      await user.click(within(card).getByRole('button', { name: /Aprovar/ }))

      expect(within(card).getByRole('button', { name: /Aprovar/ })).toHaveTextContent('11')
      expect(unlikePost).toHaveBeenCalledWith('a')
    })

    it('puts the count back when the api fails', async () => {
      const user = userEvent.setup()
      vi.mocked(likePost).mockRejectedValue(new ApiError('server', 500, ['x']))
      renderFeed({ auth: { status: 'authenticated', user: ana } })
      const card = (await screen.findByRole('link', { name: 'Primeiro post' })).closest('article')!

      await user.click(within(card).getByRole('button', { name: /Aprovar/ }))

      await waitFor(() =>
        expect(within(card).getByRole('button', { name: /Aprovar/ })).toHaveTextContent('12'),
      )
      expect(within(card).getByRole('button', { name: /Aprovar/ })).toHaveAttribute(
        'aria-pressed',
        'false',
      )
    })
  })
})
