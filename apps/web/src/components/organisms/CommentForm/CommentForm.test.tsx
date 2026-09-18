import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CommentForm } from './CommentForm'

describe('CommentForm', () => {
  it('does not submit an empty comment', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<CommentForm onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Comentar' }))

    expect(screen.getByText('Escreva um comentário')).toBeInTheDocument()
    expect(screen.getByLabelText('Comentário')).toBeInvalid()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the trimmed text and clears the field once it resolves', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CommentForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Comentário'), '  Boa!  ')
    await user.click(screen.getByRole('button', { name: 'Comentar' }))

    expect(onSubmit).toHaveBeenCalledWith('Boa!')
    await waitFor(() => expect(screen.getByLabelText('Comentário')).toHaveValue(''))
  })

  it('keeps the text when onSubmit rejects', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockRejectedValue(new Error('falhou'))
    render(<CommentForm onSubmit={onSubmit} />)

    await user.type(screen.getByLabelText('Comentário'), 'Boa!')
    await user.click(screen.getByRole('button', { name: 'Comentar' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(screen.getByLabelText('Comentário')).toHaveValue('Boa!')
  })

  it('shows the submit error as an alert', () => {
    render(<CommentForm onSubmit={vi.fn()} submitError="Entre na sua conta para comentar." />)

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Entre na sua conta para comentar.',
    )
  })

  it('disables the button while submitting', () => {
    render(<CommentForm onSubmit={vi.fn()} isSubmitting />)

    expect(screen.getByRole('button', { name: 'Enviando...' })).toBeDisabled()
  })

  it('uses a custom submit label', () => {
    render(<CommentForm onSubmit={vi.fn()} submitLabel="Responder" />)

    expect(screen.getByRole('button', { name: 'Responder' })).toBeInTheDocument()
  })
})
