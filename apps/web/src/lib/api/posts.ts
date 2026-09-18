import { apiClient } from './client'
import type {
  CreatePostRequest,
  ListPostsParams,
  PaginatedPosts,
  PostDetail,
  PostLikeSummary,
} from './types'

/** GET /posts?q&tags&sort&page&limit -> 200 | 422 invalid query */
export async function listPosts(
  params: ListPostsParams = {},
): Promise<PaginatedPosts> {
  const { data } = await apiClient.get<PaginatedPosts>('/posts', {
    params: {
      q: params.q || undefined,
      // The API reads `tags` as a comma-separated list of slugs.
      tags: params.tags?.length ? params.tags.join(',') : undefined,
      sort: params.sort,
      page: params.page,
      limit: params.limit,
    },
  })
  return data
}

/** GET /posts/:id -> 200 | 400 malformed id | 404 */
export async function getPost(id: string): Promise<PostDetail> {
  const { data } = await apiClient.get<PostDetail>(`/posts/${id}`)
  return data
}

/** POST /posts -> 201 + Location | 401 | 422 validation */
export async function createPost(
  payload: CreatePostRequest,
): Promise<PostDetail> {
  const { data } = await apiClient.post<PostDetail>('/posts', payload)
  return data
}

/** POST /posts/:id/likes -> 201 | 400 | 401 | 404 | 409 already liked */
export async function likePost(id: string): Promise<PostLikeSummary> {
  const { data } = await apiClient.post<PostLikeSummary>(`/posts/${id}/likes`)
  return data
}

/** DELETE /posts/:id/likes -> 204 | 400 | 401 | 404 */
export async function unlikePost(id: string): Promise<void> {
  await apiClient.delete(`/posts/${id}/likes`)
}
