import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { makeComment, makeThread } from '../../../test/fixtures'
import { CommentList } from './CommentList'

describe('CommentList', () => {
  it('lists every root comment under a Comentários heading', () => {
    render(
      <CommentList
        comments={[
          makeThread({ id: 'a', body: 'Primeiro comentário' }),
          makeThread({
            id: 'b',
            body: 'Segundo comentário',
            replies: [makeComment({ id: 'r', parentId: 'b' })],
          }),
        ]}
        isAuthenticated
        onReply={vi.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Comentários' })).toBeInTheDocument()
    expect(screen.getByText(/Primeiro comentário/)).toBeInTheDocument()
    expect(screen.getByText(/Segundo comentário/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ver respostas (1)' })).toBeInTheDocument()
  })

  it('says so when there are no comments', () => {
    render(<CommentList comments={[]} isAuthenticated onReply={vi.fn()} />)

    expect(screen.getByText('Ainda não há comentários.')).toBeInTheDocument()
  })

  it('renders the footer slot', () => {
    render(
      <CommentList
        comments={[]}
        isAuthenticated={false}
        onReply={vi.fn()}
        footer={<p>Entre para comentar</p>}
      />,
    )

    expect(screen.getByText('Entre para comentar')).toBeInTheDocument()
  })
})
