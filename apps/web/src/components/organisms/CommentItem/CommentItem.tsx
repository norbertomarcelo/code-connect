import { useId, useState } from 'react'
import { commentErrorMessage } from '../../../posts/messages'
import type { Comment, CommentThread } from '../../../lib/api/types'
import { Avatar } from '../../atoms/Avatar'
import { CommentForm } from '../CommentForm'

interface CommentItemProps {
  comment: CommentThread
  isAuthenticated: boolean
  /** Rejects on failure so the reply form keeps what was typed. */
  onReply: (parentId: string, body: string) => Promise<void>
}

function CommentBody({ comment }: { comment: Comment }) {
  return (
    <div className="flex items-start gap-2">
      <Avatar name={comment.author.name} />
      <p className="text-sm">
        <span className="font-semibold">@{comment.author.handle}</span>{' '}
        {comment.body}
      </p>
    </div>
  )
}

const actionClasses =
  'rounded text-sm font-semibold hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary'

export function CommentItem({
  comment,
  isAuthenticated,
  onReply,
}: CommentItemProps) {
  const repliesId = useId()
  const [showReplies, setShowReplies] = useState(false)
  const [isReplying, setIsReplying] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  async function handleReply(body: string) {
    setIsSubmitting(true)
    setSubmitError(null)

    try {
      await onReply(comment.id, body)
      setIsReplying(false)
      setShowReplies(true)
    } catch (error) {
      setSubmitError(commentErrorMessage(error))
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <li className="flex flex-col gap-2">
      <CommentBody comment={comment} />

      <div className="flex flex-wrap items-center gap-4 pl-10">
        {isAuthenticated ? (
          <button
            type="button"
            className={actionClasses}
            aria-expanded={isReplying}
            onClick={() => setIsReplying((open) => !open)}
          >
            Responder
          </button>
        ) : null}

        {comment.replies.length > 0 ? (
          <button
            type="button"
            className={actionClasses}
            aria-expanded={showReplies}
            aria-controls={repliesId}
            onClick={() => setShowReplies((open) => !open)}
          >
            {showReplies
              ? 'Ocultar respostas'
              : `Ver respostas (${comment.replies.length})`}
          </button>
        ) : null}
      </div>

      {isReplying ? (
        <div className="pl-10">
          <CommentForm
            autoFocus
            label={`Resposta para @${comment.author.handle}`}
            placeholder="Escreva uma resposta"
            submitLabel="Responder"
            isSubmitting={isSubmitting}
            submitError={submitError}
            onSubmit={handleReply}
          />
        </div>
      ) : null}

      {showReplies ? (
        <ul id={repliesId} className="flex flex-col gap-4 pl-10">
          {comment.replies.map((reply) => (
            <li key={reply.id}>
              <CommentBody comment={reply} />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  )
}
