import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { DRIZZLE, type Database } from '../src/database/database.constants.js';
import { resetDatabase } from './support/reset-database.js';

describe('Posts (e2e)', () => {
  let app: INestApplication;
  let token: string;

  const publish = (body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post('/posts')
      .set('Authorization', `Bearer ${token}`)
      .send({
        title: 'Título',
        description: 'Descrição',
        body: 'corpo',
        ...body,
      });

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        errorHttpStatusCode: 422,
      }),
    );
    await app.init();
    await resetDatabase(app.get<Database>(DRIZZLE));

    await request(app.getHttpServer()).post('/users').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'super-secret-1',
    });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ada@example.com', password: 'super-secret-1' });
    token = login.body.accessToken;
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /posts returns 401 without a token', async () => {
    await request(app.getHttpServer())
      .post('/posts')
      .send({ title: 'x', description: 'y', body: 'z' })
      .expect(401);
  });

  it('POST /posts creates a post with a Location header', async () => {
    const response = await publish({ tags: ['React'] }).expect(201);

    expect(response.headers.location).toBe(`/posts/${response.body.id}`);
    expect(response.body).toMatchObject({
      title: 'Título',
      thumbnailUrl: null,
      tags: [{ slug: 'react', label: 'React' }],
      author: { handle: 'ada' },
    });
    expect(JSON.stringify(response.body)).not.toContain('ada@example.com');
  });

  it('POST /posts returns 422 for an invalid payload', async () => {
    await publish({ title: '', thumbnailUrl: 'not-a-url' }).expect(422);
  });

  it('GET /posts is public and reports viewerHasLiked false for anonymous', async () => {
    await publish({}).expect(201);

    const response = await request(app.getHttpServer())
      .get('/posts')
      .expect(200);

    expect(response.body).toMatchObject({
      page: 1,
      limit: 12,
      total: 1,
      totalPages: 1,
    });
    expect(response.body.items[0].viewerHasLiked).toBe(false);
  });

  it('GET /posts ignores an invalid token instead of failing', async () => {
    await request(app.getHttpServer())
      .get('/posts')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(200);
  });

  it('GET /posts filters by q and by every tag', async () => {
    await publish({ title: 'Hooks em React', tags: ['react'] });
    await publish({ title: 'Grid em CSS', tags: ['css'] });
    await publish({ title: 'React e CSS', tags: ['react', 'css'] });

    const byText = await request(app.getHttpServer())
      .get('/posts?q=hooks')
      .expect(200);
    const byTags = await request(app.getHttpServer())
      .get('/posts?tags=react,css')
      .expect(200);

    expect(byText.body.items.map((p: { title: string }) => p.title)).toEqual([
      'Hooks em React',
    ]);
    expect(byTags.body.items.map((p: { title: string }) => p.title)).toEqual([
      'React e CSS',
    ]);
  });

  it('GET /posts paginates', async () => {
    for (const title of ['A', 'B', 'C']) await publish({ title });

    const response = await request(app.getHttpServer())
      .get('/posts?page=2&limit=2')
      .expect(200);

    expect(response.body).toMatchObject({ total: 3, totalPages: 2 });
    expect(response.body.items).toHaveLength(1);
  });

  it('GET /posts returns 422 for an out-of-range limit', async () => {
    await request(app.getHttpServer()).get('/posts?limit=999').expect(422);
  });

  it('GET /posts/:id returns the post with its body', async () => {
    const created = await publish({ body: 'const a = 1' });

    const response = await request(app.getHttpServer())
      .get(`/posts/${created.body.id}`)
      .expect(200);

    expect(response.body.body).toBe('const a = 1');
  });

  it('GET /posts/:id returns 404 for an unknown id and 400 for a malformed one', async () => {
    await request(app.getHttpServer())
      .get('/posts/00000000-0000-0000-0000-000000000000')
      .expect(404);
    await request(app.getHttpServer()).get('/posts/abc').expect(400);
  });
});
