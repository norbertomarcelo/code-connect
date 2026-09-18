import type { PostSummary } from '../../../lib/api/types'
import { Tag } from '../../atoms/Tag'
import { AuthorByline } from '../../molecules/AuthorByline'
import { IconCount } from '../../molecules/IconCount'
import { PostThumbnail } from '../../molecules/PostThumbnail'

interface PostHeaderProps {
  post: PostSummary
  onToggleLike: (post: PostSummary) => void
}

/** The top of the post page: the card of the feed, at full size. */
export function PostHeader({ post, onToggleLike }: PostHeaderProps) {
  return (
    <article className="flex flex-col">
      <div className="h-80 rounded-t-lg bg-input p-6">
        <PostThumbnail src={post.thumbnailUrl} />
      </div>

      <div className="flex flex-col gap-4 rounded-b-lg bg-page p-4">
        <div className="flex flex-col gap-2 text-muted">
          <h1 className="text-lg font-semibold">{post.title}</h1>
          <p className="text-sm">{post.description}</p>
        </div>

        {post.tags.length > 0 ? (
          <ul aria-label="Tags" className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag.slug}>
                <Tag>{tag.label}</Tag>
              </li>
            ))}
          </ul>
        ) : null}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <IconCount
              icon="code"
              label="Aprovar"
              count={post.likeCount}
              pressed={post.viewerHasLiked}
              onClick={() => onToggleLike(post)}
            />
            <IconCount icon="chat" label="Comentários" count={post.commentCount} />
          </div>
          <AuthorByline name={post.author.name} handle={post.author.handle} />
        </div>
      </div>
    </article>
  )
}
