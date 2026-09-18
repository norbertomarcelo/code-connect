import type { Comment, CommentThread } from './comments.service.js';
import type {
  CommentResponseDto,
  CommentThreadResponseDto,
} from './dto/comment-response.dto.js';

export function toCommentDto(comment: Comment): CommentResponseDto {
  return {
    id: comment.id,
    postId: comment.postId,
    parentId: comment.parentId,
    body: comment.body,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.author.id,
      name: comment.author.name,
      handle: comment.author.handle,
    },
  };
}

export function toCommentThreadDto(
  thread: CommentThread,
): CommentThreadResponseDto {
  return Object.assign({}, toCommentDto(thread), {
    replies: thread.replies.map(toCommentDto),
  });
}
