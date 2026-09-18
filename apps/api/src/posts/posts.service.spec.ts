import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { createTestDatabase } from '../../test/support/test-database.js';
import { resetDatabase } from '../../test/support/reset-database.js';
import { DRIZZLE } from '../database/database.constants.js';
import { comments, postLikes, users } from '../database/schema.js';
import { TagsService } from '../tags/tags.service.js';
import type { CreatePostDto } from './dto/create-post.dto.js';
import { PostsService } from './posts.service.js';

describe('PostsService', () => {
  let service: PostsService;
  let testDb: Awaited<ReturnType<typeof createTestDatabase>>;
  let authorId: string;

  const list = (overrides: Partial<Parameters<PostsService['list']>[0]> = {}) =>
    service.list({
      tagSlugs: [],
      sort: 'recent',
      page: 1,
      limit: 12,
      ...overrides,
    });

  const publish = (overrides: Partial<CreatePostDto> = {}) =>
    service.create(authorId, {
      title: 'Um título',
      description: 'Uma descrição',
      body: 'Um corpo',
      ...overrides,
    });

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
      .values({
        name: 'Júlio Andrade',
        email: 'Julio@codeconnect.dev',
        passwordHash: 'hash',
      })
      .returning();
    authorId = author.id;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostsService,
        TagsService,
        { provide: DRIZZLE, useValue: testDb.db },
      ],
    }).compile();

    service = module.get(PostsService);
  });

  it('creates a post with new and existing tags', async () => {
    await publish({ tags: ['React'] });
    const post = await publish({ tags: ['react', 'Front-end'] });

    expect(post.tags).toEqual([
      { slug: 'front-end', label: 'Front-end' },
      { slug: 'react', label: 'React' },
    ]);
    expect(post.author).toEqual({
      id: authorId,
      name: 'Júlio Andrade',
      handle: 'julio',
    });
    expect(post.thumbnailUrl).toBeNull();
  });

  it('lists newest first with an author handle instead of an email', async () => {
    await publish({ title: 'Primeiro' });
    await publish({ title: 'Segundo' });

    const { items, total } = await list();

    expect(items.map((post) => post.title)).toEqual(['Segundo', 'Primeiro']);
    expect(total).toBe(2);
    expect(JSON.stringify(items)).not.toContain('codeconnect.dev');
  });

  describe('full-text search', () => {
    it('matches the title, the description and the body', async () => {
      await publish({ title: 'Sobre hooks' });
      await publish({ description: 'Explica os hooks do React' });
      await publish({ body: 'useEffect e outros hooks' });
      await publish({ title: 'Nada a ver' });

      const { items } = await list({ q: 'hooks' });

      expect(items).toHaveLength(3);
    });

    it('stems words, so a singular query finds the plural', async () => {
      await publish({ title: 'Componentes reutilizáveis' });

      const { items } = await list({ q: 'componente' });

      expect(items).toHaveLength(1);
    });

    it('ranks a title hit above a body hit', async () => {
      await publish({ title: 'Outro assunto', body: 'fala de acessibilidade' });
      await publish({ title: 'Acessibilidade na prática' });

      const { items } = await list({ q: 'acessibilidade' });

      expect(items.map((post) => post.title)).toEqual([
        'Acessibilidade na prática',
        'Outro assunto',
      ]);
    });

    it('treats quotes and SQL comments as plain text', async () => {
      await publish();

      const { items } = await list({ q: `'; drop table posts; --` });

      expect(items).toEqual([]);
      expect((await list()).total).toBe(1);
    });
  });

  describe('tag filter', () => {
    beforeEach(async () => {
      await publish({ title: 'Só React', tags: ['react'] });
      await publish({ title: 'React e CSS', tags: ['react', 'css'] });
      await publish({ title: 'Só CSS', tags: ['css'] });
    });

    it('returns posts carrying the tag', async () => {
      const { items } = await list({ tagSlugs: ['css'] });

      expect(items.map((post) => post.title).sort()).toEqual([
        'React e CSS',
        'Só CSS',
      ]);
    });

    it('requires every requested tag (AND, not OR)', async () => {
      const { items } = await list({ tagSlugs: ['react', 'css'] });

      expect(items.map((post) => post.title)).toEqual(['React e CSS']);
    });

    it('returns nothing for an unknown tag', async () => {
      expect((await list({ tagSlugs: ['nao-existe'] })).items).toEqual([]);
    });

    it('combines with the text search', async () => {
      await publish({ title: 'Grid em CSS', tags: ['css'] });

      const { items } = await list({ q: 'grid', tagSlugs: ['css'] });

      expect(items.map((post) => post.title)).toEqual(['Grid em CSS']);
    });
  });

  it('paginates and reports the unpaged total', async () => {
    for (const title of ['A', 'B', 'C']) await publish({ title });

    const second = await list({ page: 2, limit: 2 });

    expect(second.items.map((post) => post.title)).toEqual(['A']);
    expect(second.total).toBe(3);
  });

  it('reports like and comment counts and whether the viewer liked', async () => {
    const post = await publish();
    const [other] = await testDb.db
      .insert(users)
      .values({ name: 'Ana', email: 'ana@x.dev', passwordHash: 'hash' })
      .returning();
    await testDb.db.insert(postLikes).values([
      { postId: post.id, userId: authorId },
      { postId: post.id, userId: other.id },
    ]);
    await testDb.db
      .insert(comments)
      .values({ postId: post.id, authorId, body: 'Boa!' });

    const asAuthor = (await list({ viewerId: authorId })).items[0];
    const asAnonymous = (await list()).items[0];

    expect(asAuthor).toMatchObject({
      likeCount: 2,
      commentCount: 1,
      viewerHasLiked: true,
    });
    expect(asAnonymous.viewerHasLiked).toBe(false);
  });

  it('orders by likes when sorting by popularity', async () => {
    const quiet = await publish({ title: 'Quieto' });
    const loved = await publish({ title: 'Amado' });
    await testDb.db
      .insert(postLikes)
      .values({ postId: loved.id, userId: authorId });

    const { items } = await list({ sort: 'popular' });

    expect(items.map((post) => post.id)).toEqual([loved.id, quiet.id]);
  });

  it('finds one post with its body, and 404s on an unknown id', async () => {
    const post = await publish({ body: 'const a = 1' });

    expect((await service.findOne(post.id)).body).toBe('const a = 1');
    await expect(
      service.findOne('00000000-0000-0000-0000-000000000000'),
    ).rejects.toThrow(NotFoundException);
  });
});
