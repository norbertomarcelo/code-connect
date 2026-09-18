import { useMemo, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../../components/atoms/Button'
import { SearchField } from '../../components/molecules/SearchField'
import { SortTabs } from '../../components/molecules/SortTabs'
import { TagFilterBar } from '../../components/molecules/TagFilterBar'
import { PostGrid } from '../../components/organisms/PostGrid'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useDebouncedCallback } from '../../hooks/useDebouncedCallback'
import { listPosts, likePost, unlikePost } from '../../lib/api/posts'
import { listTags } from '../../lib/api/tags'
import type { PaginatedPosts, PostSort, PostSummary } from '../../lib/api/types'
import { postsErrorMessage } from '../../posts/messages'

const PAGE_SIZE = 12

function parseTags(value: string): string[] {
  return value
    .split(',')
    .map((slug) => slug.trim())
    .filter(Boolean)
}

export function FeedPage() {
  const { status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  // The URL is the source of truth: a filtered feed is a shareable link, the
  // back button works and F5 keeps the filter.
  const q = searchParams.get('q') ?? ''
  const tagsParam = searchParams.get('tags') ?? ''
  const tagSlugs = useMemo(() => parseTags(tagsParam), [tagsParam])
  const sort: PostSort = searchParams.get('sort') === 'popular' ? 'popular' : 'recent'
  const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)

  // While typing, the input is the source of truth and the URL catches up
  // after a pause. `replace`, so one search does not leave a history entry per
  // keystroke. The field is only seeded from the URL on mount: syncing it both
  // ways through a debounce is the classic recipe for a loop.
  const [searchText, setSearchText] = useState(q)
  const commitSearch = useDebouncedCallback((value: string) => {
    setSearchParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set('q', value)
        else next.delete('q')
        next.delete('page')
        return next
      },
      { replace: true },
    )
  }, 300)

  function handleSearchChange(value: string) {
    setSearchText(value)
    commitSearch.run(value)
  }

  function updateParams(change: (params: URLSearchParams) => void) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous)
      change(next)
      // Any change of filter or order goes back to the first page.
      next.delete('page')
      return next
    })
  }

  function setTags(slugs: string[]) {
    updateParams((params) => {
      if (slugs.length > 0) params.set('tags', slugs.join(','))
      else params.delete('tags')
    })
  }

  function handleSortChange(value: PostSort) {
    updateParams((params) => {
      if (value === 'popular') params.set('sort', value)
      else params.delete('sort')
    })
  }

  function handleClear() {
    // A search still waiting to reach the URL would bring the old text back.
    commitSearch.cancel()
    setSearchText('')
    updateParams((params) => {
      params.delete('q')
      params.delete('tags')
    })
  }

  function handlePageChange(next: number) {
    setSearchParams((previous) => {
      const params = new URLSearchParams(previous)
      if (next > 1) params.set('page', String(next))
      else params.delete('page')
      return params
    })
  }

  // `status` is a dependency on purpose: the auth bootstrap resolves after the
  // first render, and `viewerHasLiked` is only right once the token is sent.
  const feed = useAsyncData(
    () => listPosts({ q, tags: tagSlugs, sort, page, limit: PAGE_SIZE }),
    [q, tagsParam, sort, page, status],
  )
  const tags = useAsyncData(() => listTags(), [])

  async function handleToggleLike(post: PostSummary) {
    if (status !== 'authenticated') {
      // Same shape ProtectedRoute uses, so the login page sends the visitor back.
      await navigate('/login', { state: { from: location } })
      return
    }

    const liked = post.viewerHasLiked
    const apply =
      (delta: number, value: boolean) => (previous: PaginatedPosts) => ({
        ...previous,
        items: previous.items.map((item) =>
          item.id === post.id
            ? { ...item, likeCount: item.likeCount + delta, viewerHasLiked: value }
            : item,
        ),
      })

    feed.setData(apply(liked ? -1 : 1, !liked))
    try {
      if (liked) await unlikePost(post.id)
      else await likePost(post.id)
    } catch {
      feed.setData(apply(liked ? 1 : -1, liked))
    }
  }

  const hasFilters = q !== '' || tagSlugs.length > 0

  function renderContent() {
    if (feed.state.status === 'loading') {
      return <p role="status" className="text-center text-muted">Carregando publicações...</p>
    }

    if (feed.state.status === 'error') {
      return (
        <div className="flex flex-col items-center gap-4">
          <p role="alert" className="text-danger">
            {postsErrorMessage(feed.state.error)}
          </p>
          <Button onClick={feed.reload}>Tentar novamente</Button>
        </div>
      )
    }

    const { items, totalPages } = feed.state.data

    return (
      <>
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 text-muted">
            <p>
              {hasFilters
                ? 'Nenhuma publicação encontrada para esses filtros.'
                : 'Nenhuma publicação ainda.'}
            </p>
            {hasFilters ? (
              <Button variant="ghost" onClick={handleClear}>
                Limpar tudo
              </Button>
            ) : null}
          </div>
        ) : (
          <PostGrid posts={items} onToggleLike={handleToggleLike} />
        )}

        {totalPages > 1 ? (
          <nav
            aria-label="Paginação"
            className="flex items-center justify-center gap-4 text-muted"
          >
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => handlePageChange(Math.min(page - 1, totalPages))}
            >
              Anterior
            </Button>
            <span>
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Próxima
            </Button>
          </nav>
        ) : null}
      </>
    )
  }

  return (
    <>
      <h1 className="sr-only">Feed</h1>

      <div className="flex flex-col gap-4">
        <SearchField value={searchText} onChange={handleSearchChange} />
        {tags.state.status === 'success' ? (
          <TagFilterBar
            tags={tags.state.data}
            selected={tagSlugs}
            onAdd={(slug) => setTags([...tagSlugs, slug])}
            onRemove={(slug) => setTags(tagSlugs.filter((item) => item !== slug))}
            onClear={handleClear}
          />
        ) : null}
      </div>

      <div className="flex flex-col gap-8">
        <SortTabs value={sort} onChange={handleSortChange} />
        {renderContent()}
      </div>
    </>
  )
}
