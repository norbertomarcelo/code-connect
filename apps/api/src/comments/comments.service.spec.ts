import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createTestDatabase } from '../../test/support/test-database.js';
import { resetDatabase } from '../../test/support/reset-database.js';
import { DRIZZLE } from '../database/database.constants.js';
import { posts, users } from '../database/schema.js';
import { CommentsService } from './comments.service.js';

describe('CommentsService', () => {
  let service: CommentsService;
  let testDb: Awaited<ReturnType<typeof createTestDatabase>>;
  let authorId: string;
  let postId: string;

  const insertPost = async () => {
    const [post] = await testDb.db
      .insert(posts)
      .values({ authorId, title: 't', description: 'd', body: 'b' })
      .returning();
    return post.id;
  };

  beforeAll(async () => {
    testDb = await createTestDatabase();
  });

  afterAll(async () => {
    await testDb.close();
  });

  beforeEach(async () => {
    await resetDatabase(testDb.db);
    const [author] = await testDb.db
      .insert(users)
      .values({ name: 'Marcia', email: 'marcia@x.dev', passwordHash: 'hash' })
      .returning();
    authorId = author.id;
    postId = await insertPost();

    const module: TestingModule = await Test.createTestingModule({
      providers: [CommentsService, { provide: DRIZZLE, useValue: testDb.db }],
    }).compile();

    service = module.get(CommentsService);
  });

  it('creates a root comment with an author handle', async () => {
    const comment = await service.create(postId, authorId, { body: 'Boa!' });

    expect(comment).toMatchObject({
      postId,
      parentId: null,
      body: 'Boa!',
      author: { id: authorId, handle: 'marcia' },
    });
  });

  it('lists roots in order with their replies embedded', async () => {
    const first = await service.create(postId, authorId, { body: 'Primeiro' });
    await service.create(postId, authorId, { body: 'Segundo' });
    await service.create(postId, authorId, {
      body: 'Resposta ao primeiro',
      parentId: first.id,
    });

    const threads = await service.listByPost(postId);

    expect(threads.map((thread) => thread.body)).toEqual([
      'Primeiro',
      'Segundo',
    ]);
    expect(threads[0].replies.map((reply) => reply.body)).toEqual([
      'Resposta ao primeiro',
    ]);
    expect(threads[1].replies).toEqual([]);
  });

  it('rejects a reply to a reply', async () => {
    const root = await service.create(postId, authorId, { body: 'Raiz' });
    const reply = await service.create(postId, authorId, {
      body: 'Resposta',
      parentId: root.id,
    });

    await expect(
      service.create(postId, authorId, { body: 'Neta', parentId: reply.id }),
    ).rejects.toThrow(UnprocessableEntityException);
  });

  it('rejects a parent that belongs to another post', async () => {
    const otherPost = await insertPost();
    const foreign = await service.create(otherPost, authorId, { body: 'x' });

    await expect(
      service.create(postId, authorId, { body: 'y', parentId: foreign.id }),
    ).rejects.toThrow(NotFoundException);
  });

  it('404s for an unknown post, parent and comment', async () => {
    const missing = '00000000-0000-0000-0000-000000000000';

    await expect(service.listByPost(missing)).rejects.toThrow(
      NotFoundException,
    );
    await expect(
      service.create(missing, authorId, { body: 'x' }),
    ).rejects.toThrow(NotFoundException);
    await expect(
      service.create(postId, authorId, { body: 'x', parentId: missing }),
    ).rejects.toThrow(NotFoundException);
    await expect(service.findOne(missing)).rejects.toThrow(NotFoundException);
  });
});
