import { apiClient } from './client'
import type { Comment, CommentThread, CreateCommentRequest } from './types'

/** GET /posts/:postId/comments -> 200 | 400 | 404 */
export async function listComments(postId: string): Promise<CommentThread[]> {
  const { data } = await apiClient.get<CommentThread[]>(
    `/posts/${postId}/comments`,
  )
  return data
}

/** POST /posts/:postId/comments -> 201 + Location | 401 | 404 | 422 nested reply */
export async function createComment(
  postId: string,
  payload: CreateCommentRequest,
): Promise<Comment> {
  const { data } = await apiClient.post<Comment>(
    `/posts/${postId}/comments`,
    payload,
  )
  return data
}
