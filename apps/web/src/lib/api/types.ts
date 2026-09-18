export interface AuthUser {
  id: string
  name: string
  email: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  accessToken: string
  /** Absolute ISO-8601 instant, not a duration. */
  expiresAt: string
  user: AuthUser
}

export interface CreateUserRequest {
  name: string
  email: string
  password: string
}

export type CreateUserResponse = AuthUser

export interface Author {
  id: string
  name: string
  handle: string
}

export interface TagSummary {
  slug: string
  label: string
}

export interface PostSummary {
  id: string
  title: string
  description: string
  thumbnailUrl: string | null
  createdAt: string
  author: Author
  tags: TagSummary[]
  likeCount: number
  commentCount: number
  viewerHasLiked: boolean
}

export interface PostDetail extends PostSummary {
  body: string
}

export interface PaginatedPosts {
  items: PostSummary[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type PostSort = 'recent' | 'popular'

export interface ListPostsParams {
  q?: string
  tags?: string[]
  sort?: PostSort
  page?: number
  limit?: number
}

export interface CreatePostRequest {
  title: string
  description: string
  body: string
  thumbnailUrl?: string | null
  tags?: string[]
}

export interface PostLikeSummary {
  postId: string
  likeCount: number
  viewerHasLiked: boolean
}

export interface Comment {
  id: string
  postId: string
  parentId: string | null
  body: string
  createdAt: string
  author: Author
}

export interface CommentThread extends Comment {
  replies: Comment[]
}

export interface CreateCommentRequest {
  body: string
  parentId?: string
}
