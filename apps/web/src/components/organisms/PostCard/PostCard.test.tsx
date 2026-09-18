import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makePost } from '../../../test/fixtures'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { PostCard } from './PostCard'

describe('PostCard', () => {
  it('shows the title as a link to the post, plus description, tags and author', () => {
    renderWithRouter(<PostCard post={makePost()} onToggleLike={vi.fn()} />)

    expect(
      screen.getByRole('link', { name: 'Lista acessível com teclado' }),
    ).toHaveAttribute('href', '/publicacoes/post-1')
    expect(
      screen.getByText('Como navegar uma lista só com as setas.'),
    ).toBeInTheDocument()
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('@julio')).toBeInTheDocument()
  })

  it('links the post only once for assistive tech', () => {
    renderWithRouter(<PostCard post={makePost()} onToggleLike={vi.fn()} />)

    expect(screen.getAllByRole('link')).toHaveLength(1)
  })

  it('shows the like and comment counts', () => {
    renderWithRouter(
      <PostCard post={makePost({ likeCount: 12, commentCount: 3 })} onToggleLike={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: /Aprovar/ })).toHaveTextContent('12')
    expect(screen.getByText(/Comentários/).parentElement).toHaveTextContent('3')
  })

  it('reports a click on Aprovar with the post', async () => {
    const user = userEvent.setup()
    const onToggleLike = vi.fn()
    const post = makePost()
    renderWithRouter(<PostCard post={post} onToggleLike={onToggleLike} />)

    await user.click(screen.getByRole('button', { name: /Aprovar/ }))

    expect(onToggleLike).toHaveBeenCalledWith(post)
  })

  it('shows Aprovar as pressed when the viewer already liked the post', () => {
    renderWithRouter(
      <PostCard post={makePost({ viewerHasLiked: true })} onToggleLike={vi.fn()} />,
    )

    expect(screen.getByRole('button', { name: /Aprovar/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  it('shows the placeholder when the post has no thumbnail', () => {
    renderWithRouter(
      <PostCard post={makePost({ thumbnailUrl: null })} onToggleLike={vi.fn()} />,
    )

    expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument()
  })

  it('omits the tag list for a post without tags', () => {
    renderWithRouter(<PostCard post={makePost({ tags: [] })} onToggleLike={vi.fn()} />)

    expect(screen.queryByRole('list', { name: 'Tags' })).not.toBeInTheDocument()
  })
})
