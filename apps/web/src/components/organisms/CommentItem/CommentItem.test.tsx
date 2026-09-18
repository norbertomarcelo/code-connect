import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../lib/api/errors'
import { makeComment, makeThread } from '../../../test/fixtures'
import { CommentItem } from './CommentItem'

const withReplies = makeThread({
  replies: [
    makeComment({ id: 'r1', parentId: 'comment-1', body: 'Valeu!' }),
    makeComment({ id: 'r2', parentId: 'comment-1', body: 'De nada!' }),
  ],
})

function renderItem(props: Partial<Parameters<typeof CommentItem>[0]> = {}) {
  return render(
    <ul>
      <CommentItem
        comment={withReplies}
        isAuthenticated
        onReply={vi.fn().mockResolvedValue(undefined)}
        {...props}
      />
    </ul>,
  )
}

describe('CommentItem', () => {
  it('shows the author handle and the text', () => {
    renderItem()

    expect(screen.getByText('@marcia')).toBeInTheDocument()
    expect(screen.getByText(/Achei muito bom seu código!/)).toBeInTheDocument()
  })

  it('hides replies until asked, and counts them', async () => {
    const user = userEvent.setup()
    renderItem()

    expect(screen.queryByText(/Valeu!/)).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ver respostas (2)' }))

    expect(screen.getByText(/Valeu!/)).toBeInTheDocument()
    expect(screen.getByText(/De nada!/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ocultar respostas' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('has no replies toggle when there are none', () => {
    renderItem({ comment: makeThread() })

    expect(screen.queryByRole('button', { name: /respostas/ })).not.toBeInTheDocument()
  })

  it('does not offer Responder to an anonymous visitor', () => {
    renderItem({ isAuthenticated: false })

    expect(screen.queryByRole('button', { name: 'Responder' })).not.toBeInTheDocument()
  })

  it('sends a reply to the comment being answered and reveals the replies', async () => {
    const user = userEvent.setup()
    const onReply = vi.fn().mockResolvedValue(undefined)
    renderItem({ onReply })

    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.type(screen.getByLabelText('Resposta para @marcia'), 'Obrigado!')
    await user.click(screen.getAllByRole('button', { name: 'Responder' })[1])

    expect(onReply).toHaveBeenCalledWith('comment-1', 'Obrigado!')
    expect(await screen.findByText(/Valeu!/)).toBeInTheDocument()
  })

  it('shows why a reply failed and keeps the form open', async () => {
    const user = userEvent.setup()
    const onReply = vi
      .fn()
      .mockRejectedValue(new ApiError('network', null, ['Network error']))
    renderItem({ onReply })

    await user.click(screen.getByRole('button', { name: 'Responder' }))
    await user.type(screen.getByLabelText('Resposta para @marcia'), 'Oi')
    await user.click(screen.getAllByRole('button', { name: 'Responder' })[1])

    expect(await screen.findByRole('alert')).toHaveTextContent(/conectar ao servidor/)
    await waitFor(() =>
      expect(screen.getByLabelText('Resposta para @marcia')).toHaveValue('Oi'),
    )
  })
})
