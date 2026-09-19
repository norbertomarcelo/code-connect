import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard.js';
import { PostsController } from './posts.controller.js';
import { PostsService } from './posts.service.js';

describe('PostsController', () => {
  let controller: PostsController;
  let postsService: {
    list: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    like: ReturnType<typeof vi.fn>;
    unlike: ReturnType<typeof vi.fn>;
  };

  const setHeader = vi.fn();
  const fakeResponse = { setHeader } as unknown as Response;
  const viewer = { id: 'user-1', name: 'Ada', email: 'ada@example.com' };
  const summary = {
    id: 'post-1',
    title: 'Título',
    description: 'Descrição',
    thumbnailUrl: null,
    createdAt: new Date('2026-09-18T15:00:00.000Z'),
    author: { id: 'user-1', name: 'Ada', handle: 'ada', email: 'leak@x.dev' },
    tags: [{ slug: 'react', label: 'React' }],
    likeCount: 2,
    commentCount: 1,
    viewerHasLiked: true,
  };

  beforeEach(async () => {
    postsService = {
      list: vi.fn(),
      findOne: vi.fn(),
      create: vi.fn(),
      like: vi.fn(),
      unlike: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostsController],
      providers: [{ provide: PostsService, useValue: postsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(OptionalJwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(PostsController);
  });

  it('lists posts with pagination metadata and passes the viewer along', async () => {
    postsService.list.mockResolvedValue({ items: [summary], total: 25 });

    const result = await controller.list(
      { q: ' hooks ', tags: ['react'], sort: 'recent', page: 2, limit: 12 },
      viewer,
    );

    expect(postsService.list).toHaveBeenCalledWith({
      q: 'hooks',
      tagSlugs: ['react'],
      sort: 'recent',
      page: 2,
      limit: 12,
      viewerId: 'user-1',
    });
    expect(result).toMatchObject({
      page: 2,
      limit: 12,
      total: 25,
      totalPages: 3,
    });
    expect(result.items[0].createdAt).toBe('2026-09-18T15:00:00.000Z');
  });

  it('never leaks an author email', async () => {
    postsService.list.mockResolvedValue({ items: [summary], total: 1 });

    const result = await controller.list(
      { sort: 'recent', page: 1, limit: 12 },
      undefined,
    );

    expect(JSON.stringify(result)).not.toContain('leak@x.dev');
    expect(postsService.list).toHaveBeenCalledWith(
      expect.objectContaining({ viewerId: undefined, tagSlugs: [] }),
    );
  });

  it('creates a post and sets the Location header', async () => {
    postsService.create.mockResolvedValue({ ...summary, body: 'código' });

    const result = await controller.create(
      { title: 'Título', description: 'Descrição', body: 'código' },
      viewer,
      fakeResponse,
    );

    expect(postsService.create).toHaveBeenCalledWith(
      'user-1',
      expect.any(Object),
    );
    expect(setHeader).toHaveBeenCalledWith(
      'Location',
      '/posts/post-1',
    );
    expect(result.body).toBe('código');
  });

  it('likes a post for the current user and sets the Location header', async () => {
    postsService.like.mockResolvedValue({
      postId: 'post-1',
      likeCount: 3,
      viewerHasLiked: true,
    });

    const result = await controller.like('post-1', viewer, fakeResponse);

    expect(postsService.like).toHaveBeenCalledWith('post-1', 'user-1');
    expect(setHeader).toHaveBeenCalledWith(
      'Location',
      '/posts/post-1/likes',
    );
    expect(result).toEqual({
      postId: 'post-1',
      likeCount: 3,
      viewerHasLiked: true,
    });
  });

  it('unlikes a post for the current user', async () => {
    postsService.unlike.mockResolvedValue(undefined);

    await controller.unlike('post-1', viewer);

    expect(postsService.unlike).toHaveBeenCalledWith('post-1', 'user-1');
  });
});
