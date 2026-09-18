import type { PostSummary } from '../../../lib/api/types'
import { PostCard } from '../PostCard'

interface PostGridProps {
  posts: PostSummary[]
  onToggleLike: (post: PostSummary) => void
}

export function PostGrid({ posts, onToggleLike }: PostGridProps) {
  return (
    <ul className="grid gap-6 md:grid-cols-2">
      {posts.map((post) => (
        <li key={post.id} className="flex">
          <PostCard post={post} onToggleLike={onToggleLike} />
        </li>
      ))}
    </ul>
  )
}
