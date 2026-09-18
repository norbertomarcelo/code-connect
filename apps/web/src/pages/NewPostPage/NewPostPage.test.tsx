import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api/errors'
import { createPost } from '../../lib/api/posts'
import { makePostDetail } from '../../test/fixtures'
import { renderWithAuth } from '../../test/renderWithAuth'
import { NewPostPage } from './NewPostPage'

vi.mock('../../lib/api/posts', () => ({ createPost: vi.fn() }))

function renderNewPost() {
  return renderWithAuth(
    <Routes>
      <Route path="/publicar" element={<NewPostPage />} />
      <Route path="/publicacoes/:id" element={<p>página do post</p>} />
      <Route path="/feed" element={<p>página do feed</p>} />
    </Routes>,
    {
      route: '/publicar',
      auth: {
        status: 'authenticated',
        user: { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' },
      },
    },
  )
}

async function fillAndPublish(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome do projeto'), 'React zero to hero')
  await user.type(screen.getByLabelText('Descrição'), 'Do zero ao avançado')
  await user.type(screen.getByLabelText('Código'), 'const a = 1')
  await user.type(screen.getByLabelText('Tags'), 'React{Enter}')
  await user.click(screen.getByRole('button', { name: 'Publicar' }))
}

describe('NewPostPage', () => {
  beforeEach(() => {
    vi.mocked(createPost).mockReset()
  })

  it('has a page heading and the form', () => {
    renderNewPost()

    expect(screen.getByRole('heading', { level: 1, name: 'Publicar' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Novo projeto' })).toBeInTheDocument()
  })

  it('publishes the post, sending no image when the url is blank, and opens it', async () => {
    const user = userEvent.setup()
    vi.mocked(createPost).mockResolvedValue(makePostDetail({ id: 'novo-id' }))
    renderNewPost()

    await fillAndPublish(user)

    expect(createPost).toHaveBeenCalledWith({
      title: 'React zero to hero',
      description: 'Do zero ao avançado',
      body: 'const a = 1',
      thumbnailUrl: null,
      tags: ['React'],
    })
    expect(await screen.findByText('página do post')).toBeInTheDocument()
  })

  it('shows API validation errors on their fields and re-enables the button', async () => {
    const user = userEvent.setup()
    vi.mocked(createPost).mockRejectedValue(
      new ApiError('validation', 422, ['title must be shorter than or equal to 200 characters']),
    )
    renderNewPost()

    await fillAndPublish(user)

    expect(await screen.findByText('Informe o nome do projeto')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publicar' })).toBeEnabled()
  })

  it('shows a general alert when the server fails', async () => {
    const user = userEvent.setup()
    vi.mocked(createPost).mockRejectedValue(new ApiError('server', 500, ['x']))
    renderNewPost()

    await fillAndPublish(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(/Não foi possível publicar/)
  })

  it('goes back to the feed from Descartar', async () => {
    const user = userEvent.setup()
    renderNewPost()

    await user.click(screen.getByRole('button', { name: 'Descartar' }))

    expect(await screen.findByText('página do feed')).toBeInTheDocument()
    expect(createPost).not.toHaveBeenCalled()
  })
})
