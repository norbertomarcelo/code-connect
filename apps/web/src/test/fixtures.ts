import type {
  Comment,
  CommentThread,
  PostDetail,
  PostSummary,
} from '../lib/api/types'

const author = { id: 'user-1', name: 'Júlio Andrade', handle: 'julio' }

export function makePost(overrides: Partial<PostSummary> = {}): PostSummary {
  return {
    id: 'post-1',
    title: 'Lista acessível com teclado',
    description: 'Como navegar uma lista só com as setas.',
    thumbnailUrl: 'https://example.com/capa.png',
    createdAt: '2026-09-18T15:00:00.000Z',
    author,
    tags: [
      { slug: 'react', label: 'React' },
      { slug: 'acessibilidade', label: 'Acessibilidade' },
    ],
    likeCount: 12,
    commentCount: 3,
    viewerHasLiked: false,
    ...overrides,
  }
}

export function makePostDetail(
  overrides: Partial<PostDetail> = {},
): PostDetail {
  return { ...makePost(), body: 'const a = 1', ...overrides }
}

export function makeComment(overrides: Partial<Comment> = {}): Comment {
  return {
    id: 'comment-1',
    postId: 'post-1',
    parentId: null,
    body: 'Achei muito bom seu código!',
    createdAt: '2026-09-18T16:00:00.000Z',
    author: { id: 'user-2', name: 'Marcia Lins', handle: 'marcia' },
    ...overrides,
  }
}

export function makeThread(
  overrides: Partial<CommentThread> = {},
): CommentThread {
  return { ...makeComment(), replies: [], ...overrides }
}
