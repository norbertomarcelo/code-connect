import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../lib/api/errors'
import { createComment, listComments } from '../../lib/api/comments'
import { getPost, likePost, unlikePost } from '../../lib/api/posts'
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

const ana = { id: 'user-1', name: 'Ana Silva', email: 'ana@example.com' }
const signedIn = { status: 'authenticated', user: ana } as const

function renderPost(options: Parameters<typeof renderWithAuth>[1] = {}) {
  return renderWithAuth(
    <Routes>
      <Route path="/publicacoes/:id" element={<PostPage />} />
      <Route path="/login" element={<p>tela de login</p>} />
      <Route path="/feed" element={<p>tela do feed</p>} />
    </Routes>,
    { route: '/publicacoes/post-1', ...options },
  )
}

describe('PostPage', () => {
  beforeEach(() => {
    vi.mocked(getPost).mockReset().mockResolvedValue(makePostDetail())
    vi.mocked(listComments)
      .mockReset()
      .mockResolvedValue([
        makeThread({
          id: 'c1',
          body: 'Primeiro comentário',
          replies: [makeComment({ id: 'r1', parentId: 'c1', body: 'Uma resposta' })],
        }),
      ])
    vi.mocked(createComment).mockReset()
    vi.mocked(likePost).mockReset().mockResolvedValue({
      postId: 'post-1',
      likeCount: 13,
      viewerHasLiked: true,
    })
    vi.mocked(unlikePost).mockReset().mockResolvedValue(undefined)
  })

  it('loads the post by the id in the url and shows it with its code and comments', async () => {
    renderPost()

    expect(screen.getByRole('status')).toHaveTextContent('Carregando publicação...')
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Lista acessível com teclado' }),
    ).toBeInTheDocument()
    expect(getPost).toHaveBeenCalledWith('post-1')
    expect(screen.getByRole('heading', { name: 'Código:' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Código' })).toHaveTextContent('const a = 1')
    expect(await screen.findByText(/Primeiro comentário/)).toBeInTheDocument()
  })

  it('says the post was not found and links back to the feed', async () => {
    vi.mocked(getPost).mockRejectedValue(new ApiError('not-found', 404, ['Post not found']))
    renderPost()

    expect(await screen.findByRole('alert')).toHaveTextContent('Publicação não encontrada.')
    expect(screen.getByRole('link', { name: 'Voltar para o feed' })).toHaveAttribute(
      'href',
      '/feed',
    )
  })

  it('shows an error with a retry when the comments fail to load', async () => {
    const user = userEvent.setup()
    vi.mocked(listComments).mockRejectedValueOnce(new ApiError('server', 500, ['x']))
    renderPost()

    expect(await screen.findByText('Não foi possível carregar os comentários.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText(/Primeiro comentário/)).toBeInTheDocument()
  })

  describe('as an anonymous visitor', () => {
    it('invites to sign in instead of showing the comment form', async () => {
      renderPost()
      await screen.findByText(/Primeiro comentário/)

      expect(screen.getByText(/Entre na sua conta para comentar/)).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Fazer login' })).toHaveAttribute('href', '/login')
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Responder' })).not.toBeInTheDocument()
    })

    it('goes to the login page when trying to like', async () => {
      const user = userEvent.setup()
      renderPost()

      await user.click(await screen.findByRole('button', { name: /Aprovar/ }))

      expect(await screen.findByText('tela de login')).toBeInTheDocument()
      expect(likePost).not.toHaveBeenCalled()
    })
  })

  describe('as a signed-in user', () => {
    it('likes right away and unlikes again', async () => {
      const user = userEvent.setup()
      renderPost({ auth: signedIn })
      const like = await screen.findByRole('button', { name: /Aprovar/ })

      await user.click(like)
      expect(screen.getByRole('button', { name: /Aprovar/ })).toHaveTextContent('13')
      expect(likePost).toHaveBeenCalledWith('post-1')

      await user.click(screen.getByRole('button', { name: /Aprovar/ }))
      expect(screen.getByRole('button', { name: /Aprovar/ })).toHaveTextContent('12')
      expect(unlikePost).toHaveBeenCalledWith('post-1')
    })

    it('adds a comment to the end of the list and counts it', async () => {
      const user = userEvent.setup()
      vi.mocked(createComment).mockResolvedValue(
        makeComment({ id: 'novo', body: 'Meu comentário' }),
      )
      renderPost({ auth: signedIn })
      await screen.findByText(/Primeiro comentário/)

      await user.type(screen.getByLabelText('Comentário'), 'Meu comentário')
      await user.click(screen.getByRole('button', { name: 'Comentar' }))

      expect(createComment).toHaveBeenCalledWith('post-1', { body: 'Meu comentário' })
      expect(await screen.findByText(/Meu comentário/)).toBeInTheDocument()
      expect(screen.getByText(/Comentários/, { selector: 'span' }).parentElement).toHaveTextContent('4')
    })

    it('keeps the text and explains when the comment fails', async () => {
      const user = userEvent.setup()
      vi.mocked(createComment).mockRejectedValue(new ApiError('network', null, ['x']))
      renderPost({ auth: signedIn })
      await screen.findByText(/Primeiro comentário/)

      await user.type(screen.getByLabelText('Comentário'), 'Vai falhar')
      await user.click(screen.getByRole('button', { name: 'Comentar' }))

      expect(await screen.findByRole('alert')).toHaveTextContent(/conectar ao servidor/)
      expect(screen.getByLabelText('Comentário')).toHaveValue('Vai falhar')
    })

    it('replies to a comment and shows the reply under it', async () => {
      const user = userEvent.setup()
      vi.mocked(createComment).mockResolvedValue(
        makeComment({ id: 'r2', parentId: 'c1', body: 'Minha resposta' }),
      )
      renderPost({ auth: signedIn })
      const comment = (await screen.findByText(/Primeiro comentário/)).closest('li')!

      await user.click(within(comment).getByRole('button', { name: 'Responder' }))
      await user.type(within(comment).getByLabelText(/Resposta para/), 'Minha resposta')
      await user.click(within(comment).getAllByRole('button', { name: 'Responder' })[1])

      expect(createComment).toHaveBeenCalledWith('post-1', {
        body: 'Minha resposta',
        parentId: 'c1',
      })
      expect(await screen.findByText(/Minha resposta/)).toBeInTheDocument()
      await waitFor(() =>
        expect(within(comment).getByRole('button', { name: 'Ocultar respostas' })).toBeInTheDocument(),
      )
    })
  })
})
