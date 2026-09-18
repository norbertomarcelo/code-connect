import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiClient } from './client'
import { createComment, listComments } from './comments'

vi.mock('./client', () => ({
  apiClient: { get: vi.fn(), post: vi.fn() },
}))

describe('comments api', () => {
  beforeEach(() => {
    vi.mocked(apiClient.get).mockReset().mockResolvedValue({ data: [] })
    vi.mocked(apiClient.post).mockReset().mockResolvedValue({ data: {} })
  })

  it('lists the comments of a post', async () => {
    await listComments('post-1')

    expect(apiClient.get).toHaveBeenCalledWith('/posts/post-1/comments')
  })

  it('creates a comment, optionally as a reply', async () => {
    await createComment('post-1', { body: 'Boa!', parentId: 'c-1' })

    expect(apiClient.post).toHaveBeenCalledWith('/posts/post-1/comments', {
      body: 'Boa!',
      parentId: 'c-1',
    })
  })
})
