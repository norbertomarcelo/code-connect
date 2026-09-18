import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { createPost, getPost, likePost, listPosts, unlikePost } from './posts'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))

describe('posts api', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset().mockResolvedValue({ data: 'ok' })
    vi.mocked(apiClient.post).mockReset().mockResolvedValue({ data: 'ok' })
    vi.mocked(apiClient.delete).mockReset().mockResolvedValue({ data: null })
  })

  it('joins tags with commas and drops empty filters', async () => {
    await listPosts({ q: 'hooks', tags: ['react', 'css'], sort: 'popular', page: 2 })

    expect(apiClient.get).toHaveBeenCalledWith('/posts', {
      params: {
        q: 'hooks',
        tags: 'react,css',
        sort: 'popular',
        page: 2,
        limit: undefined,
      },
    })
  })

  it('turns an empty query and an empty tag list into undefined', async () => {
    await listPosts({ q: '', tags: [] })

    expect(apiClient.get).toHaveBeenCalledWith('/posts', {
      params: expect.objectContaining({ q: undefined, tags: undefined }),
    })
  })

  it('gets one post by id', async () => {
    await getPost('abc')

    expect(apiClient.get).toHaveBeenCalledWith('/posts/abc')
  })

  it('creates a post', async () => {
    const payload = { title: 't', description: 'd', body: 'b' }
    await createPost(payload)

    expect(apiClient.post).toHaveBeenCalledWith('/posts', payload)
  })

  it('likes and unlikes through the likes collection', async () => {
    await likePost('abc')
    await unlikePost('abc')

    expect(apiClient.post).toHaveBeenCalledWith('/posts/abc/likes')
    expect(apiClient.delete).toHaveBeenCalledWith('/posts/abc/likes')
  })
})
