import { useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { useAuth } from '../../auth/useAuth'
import { Button } from '../../components/atoms/Button'
import { CodeBlock } from '../../components/atoms/CodeBlock'
import { TextLink } from '../../components/atoms/TextLink'
import { CommentForm } from '../../components/organisms/CommentForm'
import { CommentList } from '../../components/organisms/CommentList'
import { PostHeader } from '../../components/organisms/PostHeader'
import { useAsyncData } from '../../hooks/useAsyncData'
import { createComment, listComments } from '../../lib/api/comments'
import { getPost, likePost, unlikePost } from '../../lib/api/posts'
import type { PostDetail, PostSummary } from '../../lib/api/types'
import { commentErrorMessage, postsErrorMessage } from '../../posts/messages'

export function PostPage() {
  const { id = '' } = useParams<{ id: string }>()
  const { status } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isCommenting, setIsCommenting] = useState(false)
  const [commentError, setCommentError] = useState<string | null>(null)

  // `status` is a dependency so `viewerHasLiked` is right once the token is sent.
  const post = useAsyncData(() => getPost(id), [id, status])
  const comments = useAsyncData(() => listComments(id), [id])

  const isAuthenticated = status === 'authenticated'

  function countOneMoreComment() {
    post.setData((previous: PostDetail) => ({
      ...previous,
      commentCount: previous.commentCount + 1,
    }))
  }

  async function handleToggleLike(current: PostSummary) {
    if (!isAuthenticated) {
      await navigate('/login', { state: { from: location } })
      return
    }

    const liked = current.viewerHasLiked
    const apply = (delta: number, value: boolean) => (previous: PostDetail) => ({
      ...previous,
      likeCount: previous.likeCount + delta,
      viewerHasLiked: value,
    })

    post.setData(apply(liked ? -1 : 1, !liked))
    try {
      if (liked) await unlikePost(current.id)
      else await likePost(current.id)
    } catch {
      post.setData(apply(liked ? 1 : -1, liked))
    }
  }

  async function handleComment(body: string) {
    setIsCommenting(true)
    setCommentError(null)

    try {
      const created = await createComment(id, { body })
      comments.setData((previous) => [...previous, { ...created, replies: [] }])
      countOneMoreComment()
    } catch (error) {
      setCommentError(commentErrorMessage(error))
      // Rejecting keeps what the user typed in the form.
      throw error
    } finally {
      setIsCommenting(false)
    }
  }

  async function handleReply(parentId: string, body: string) {
    const created = await createComment(id, { body, parentId })
    comments.setData((previous) =>
      previous.map((thread) =>
        thread.id === parentId
          ? { ...thread, replies: [...thread.replies, created] }
          : thread,
      ),
    )
    countOneMoreComment()
  }

  if (post.state.status === 'loading') {
    return (
      <p role="status" className="text-center text-muted">
        Carregando publicação...
      </p>
    )
  }

  if (post.state.status === 'error') {
    return (
      <div className="flex flex-col items-center gap-4">
        <h1 className="sr-only">Publicação</h1>
        <p role="alert" className="text-danger">
          {postsErrorMessage(post.state.error)}
        </p>
        <TextLink to="/feed" variant="primary">
          Voltar para o feed
        </TextLink>
      </div>
    )
  }

  const commentFooter = isAuthenticated ? (
    <CommentForm
      isSubmitting={isCommenting}
      submitError={commentError}
      onSubmit={handleComment}
    />
  ) : (
    <p className="text-sm">
      Entre na sua conta para comentar.{' '}
      <TextLink to="/login" state={{ from: location }} variant="primary">
        Fazer login
      </TextLink>
    </p>
  )

  function renderComments() {
    if (comments.state.status === 'loading') {
      return (
        <p role="status" className="text-center text-muted">
          Carregando comentários...
        </p>
      )
    }

    if (comments.state.status === 'error') {
      return (
        <div className="flex flex-col items-center gap-4">
          <p role="alert" className="text-danger">
            Não foi possível carregar os comentários.
          </p>
          <Button onClick={comments.reload}>Tentar novamente</Button>
        </div>
      )
    }

    return (
      <CommentList
        comments={comments.state.data}
        isAuthenticated={isAuthenticated}
        onReply={handleReply}
        footer={commentFooter}
      />
    )
  }

  return (
    <>
      <PostHeader post={post.state.data} onToggleLike={handleToggleLike} />

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold text-muted">Código:</h2>
        <CodeBlock code={post.state.data.body} />
      </section>

      {renderComments()}
    </>
  )
}
