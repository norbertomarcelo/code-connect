import type { ReactNode } from 'react'
import type { CommentThread } from '../../../lib/api/types'
import { CommentItem } from '../CommentItem'

interface CommentListProps {
  comments: CommentThread[]
  isAuthenticated: boolean
  onReply: (parentId: string, body: string) => Promise<void>
  /** Rendered under the list: the new-comment form, or an invite to sign in. */
  footer?: ReactNode
}

export function CommentList({
  comments,
  isAuthenticated,
  onReply,
  footer,
}: CommentListProps) {
  return (
    <section
      aria-labelledby="comments-heading"
      className="flex flex-col gap-6 rounded-lg bg-page p-6 text-muted"
    >
      <h2 id="comments-heading" className="text-xl font-semibold">
        Comentários
      </h2>

      {comments.length === 0 ? (
        <p className="text-sm">Ainda não há comentários.</p>
      ) : (
        <ul className="flex flex-col divide-y divide-muted/30 [&>li]:py-6 [&>li:first-child]:pt-0 [&>li:last-child]:pb-0">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isAuthenticated={isAuthenticated}
              onReply={onReply}
            />
          ))}
        </ul>
      )}

      {footer}
    </section>
  )
}
