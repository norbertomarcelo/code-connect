import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { makePost } from '../../../test/fixtures'
import { renderWithRouter } from '../../../test/renderWithRouter'
import { PostGrid } from './PostGrid'

const posts = [
  makePost({ id: 'a', title: 'Primeiro post' }),
  makePost({ id: 'b', title: 'Segundo post' }),
]

describe('PostGrid', () => {
  it('renders one card per post', () => {
    renderWithRouter(<PostGrid posts={posts} onToggleLike={vi.fn()} />)

    expect(screen.getAllByRole('article')).toHaveLength(2)
    expect(screen.getByRole('link', { name: 'Primeiro post' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Segundo post' })).toBeInTheDocument()
  })

  it('reports the like of the right post', async () => {
    const user = userEvent.setup()
    const onToggleLike = vi.fn()
    renderWithRouter(<PostGrid posts={posts} onToggleLike={onToggleLike} />)

    const second = screen.getByRole('link', { name: 'Segundo post' }).closest('article')!
    await user.click(within(second).getByRole('button', { name: /Aprovar/ }))

    expect(onToggleLike).toHaveBeenCalledWith(posts[1])
  })
})
