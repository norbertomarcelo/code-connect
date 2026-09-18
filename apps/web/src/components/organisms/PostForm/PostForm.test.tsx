import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PostForm } from './PostForm'

function setup(props: Partial<Parameters<typeof PostForm>[0]> = {}) {
  const onSubmit = vi.fn()
  const onDiscard = vi.fn()
  render(<PostForm onSubmit={onSubmit} onDiscard={onDiscard} {...props} />)
  return { onSubmit, onDiscard }
}

async function fillRequired(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome do projeto'), 'React zero to hero')
  await user.type(screen.getByLabelText('Descrição'), 'Do zero ao avançado')
  await user.type(screen.getByLabelText('Código'), 'const a = 1')
}

describe('PostForm', () => {
  it('does not submit and flags every required field when empty', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()

    await user.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(screen.getByText('Informe o nome do projeto')).toBeInTheDocument()
    expect(screen.getByText('Informe uma descrição')).toBeInTheDocument()
    expect(screen.getByText('Informe o código')).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('rejects an image url that is not http(s)', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await fillRequired(user)

    await user.type(screen.getByLabelText('URL da imagem (opcional)'), 'nao-e-url')
    await user.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(
      screen.getByText('Informe uma URL válida (http ou https)'),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits the filled values, tags included', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await fillRequired(user)
    await user.type(screen.getByLabelText('URL da imagem (opcional)'), 'https://example.com/a.png')
    await user.type(screen.getByLabelText('Tags'), 'React{Enter}CSS{Enter}')

    await user.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(onSubmit).toHaveBeenCalledWith({
      title: 'React zero to hero',
      description: 'Do zero ao avançado',
      body: 'const a = 1',
      thumbnailUrl: 'https://example.com/a.png',
      tags: ['React', 'CSS'],
    })
  })

  it('accepts a post without an image', async () => {
    const user = userEvent.setup()
    const { onSubmit } = setup()
    await fillRequired(user)

    await user.click(screen.getByRole('button', { name: 'Publicar' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ thumbnailUrl: '' }))
  })

  it('previews the image while its url is valid, and the placeholder otherwise', async () => {
    const user = userEvent.setup()
    const { container } = render(<PostForm onSubmit={vi.fn()} onDiscard={vi.fn()} />)

    expect(screen.getByTestId('thumbnail-placeholder')).toBeInTheDocument()

    await user.type(
      screen.getByLabelText('URL da imagem (opcional)'),
      'https://example.com/a.png',
    )

    expect(container.querySelector('img')).toHaveAttribute(
      'src',
      'https://example.com/a.png',
    )
  })

  it('calls onDiscard from Descartar without submitting', async () => {
    const user = userEvent.setup()
    const { onSubmit, onDiscard } = setup()

    await user.click(screen.getByRole('button', { name: 'Descartar' }))

    expect(onDiscard).toHaveBeenCalledTimes(1)
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows errors reported by the API on their fields', () => {
    setup({ fieldErrors: { title: 'Informe o nome do projeto' } })

    expect(screen.getByLabelText('Nome do projeto')).toBeInvalid()
  })

  it('shows the submit error and disables the buttons while submitting', () => {
    setup({ submitError: 'Falha no servidor', isSubmitting: true })

    expect(screen.getByRole('alert')).toHaveTextContent('Falha no servidor')
    expect(screen.getByRole('button', { name: 'Publicando...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Descartar' })).toBeDisabled()
  })
})
