import { Link } from 'react-router'
import type { PostSummary } from '../../../lib/api/types'
import { Tag } from '../../atoms/Tag'
import { AuthorByline } from '../../molecules/AuthorByline'
import { IconCount } from '../../molecules/IconCount'
import { PostThumbnail } from '../../molecules/PostThumbnail'

interface PostCardProps {
  post: PostSummary
  onToggleLike: (post: PostSummary) => void
}

export function PostCard({ post, onToggleLike }: PostCardProps) {
  const detailPath = `/publicacoes/${post.id}`

  return (
    <article className="flex h-full w-full flex-col">
      {/* The title already links here: hide this second link from assistive
          tech and from the tab order instead of announcing it twice. */}
      <Link
        to={detailPath}
        aria-hidden="true"
        tabIndex={-1}
        className="block h-60 rounded-t-lg bg-input p-6"
      >
        <PostThumbnail src={post.thumbnailUrl} />
      </Link>

      <div className="flex flex-1 flex-col gap-4 rounded-b-lg bg-page p-4">
        <div className="flex flex-col gap-2 text-muted">
          <h2 className="text-lg font-semibold">
            <Link
              to={detailPath}
              className="rounded hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary"
            >
              {post.title}
            </Link>
          </h2>
          <p className="line-clamp-3 text-sm">{post.description}</p>
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

        <div className="mt-auto flex items-center justify-between">
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
