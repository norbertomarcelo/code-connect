import { Test, TestingModule } from '@nestjs/testing';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { CommentsController } from './comments.controller.js';
import { CommentsService } from './comments.service.js';

describe('CommentsController', () => {
  let controller: CommentsController;
  let commentsService: {
    listByPost: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };

  const fakeResponse = { setHeader: vi.fn() } as unknown as Response;
  const user = { id: 'user-1', name: 'Ada', email: 'ada@example.com' };
  const comment = {
    id: 'comment-1',
    postId: 'post-1',
    parentId: null,
    body: 'Boa!',
    createdAt: new Date('2026-09-18T15:00:00.000Z'),
    author: { id: 'user-1', name: 'Ada', handle: 'ada', email: 'leak@x.dev' },
  };

  beforeEach(async () => {
    commentsService = {
      listByPost: vi.fn(),
      create: vi.fn(),
      findOne: vi.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentsController],
      providers: [{ provide: CommentsService, useValue: commentsService }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(CommentsController);
  });

  it('lists threads with embedded replies and no author email', async () => {
    commentsService.listByPost.mockResolvedValue([
      {
        ...comment,
        replies: [{ ...comment, id: 'comment-2', parentId: 'comment-1' }],
      },
    ]);

    const result = await controller.listByPost('post-1');

    expect(result[0].replies[0].parentId).toBe('comment-1');
    expect(result[0].createdAt).toBe('2026-09-18T15:00:00.000Z');
    expect(JSON.stringify(result)).not.toContain('leak@x.dev');
  });

  it('creates a comment and points Location at /comments/:id', async () => {
    commentsService.create.mockResolvedValue(comment);

    await controller.create('post-1', { body: 'Boa!' }, user, fakeResponse);

    expect(commentsService.create).toHaveBeenCalledWith('post-1', 'user-1', {
      body: 'Boa!',
    });
    expect(fakeResponse.setHeader).toHaveBeenCalledWith(
      'Location',
      '/comments/comment-1',
    );
  });

  it('gets one comment', async () => {
    commentsService.findOne.mockResolvedValue(comment);

    expect((await controller.findOne('comment-1')).id).toBe('comment-1');
  });
});
