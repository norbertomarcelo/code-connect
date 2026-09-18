import type { PostDetail, PostSummary } from './posts.service.js';
import type {
  PostDetailResponseDto,
  PostSummaryResponseDto,
} from './dto/post-response.dto.js';

export function toPostSummaryDto(post: PostSummary): PostSummaryResponseDto {
  return {
    id: post.id,
    title: post.title,
    description: post.description,
    thumbnailUrl: post.thumbnailUrl,
    createdAt: post.createdAt.toISOString(),
    author: {
      id: post.author.id,
      name: post.author.name,
      handle: post.author.handle,
    },
    tags: post.tags.map(({ slug, label }) => ({ slug, label })),
    likeCount: post.likeCount,
    commentCount: post.commentCount,
    viewerHasLiked: post.viewerHasLiked,
  };
}

export function toPostDetailDto(post: PostDetail): PostDetailResponseDto {
  return Object.assign({}, toPostSummaryDto(post), { body: post.body });
}
