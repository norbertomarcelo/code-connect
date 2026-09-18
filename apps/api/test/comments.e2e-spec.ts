import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { DRIZZLE, type Database } from '../src/database/database.constants.js';
import { resetDatabase } from './support/reset-database.js';

describe('Comments (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let postId: string;

  const auth = () => ({ Authorization: `Bearer ${token}` });
  const comment = (body: Record<string, unknown>) =>
    request(app.getHttpServer())
      .post(`/posts/${postId}/comments`)
      .set(auth())
      .send({ body: 'Boa!', ...body });

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

    const post = await request(app.getHttpServer())
      .post('/posts')
      .set(auth())
      .send({ title: 'Título', description: 'Descrição', body: 'corpo' });
    postId = post.body.id;
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST requires a token', async () => {
    await request(app.getHttpServer())
      .post(`/posts/${postId}/comments`)
      .send({ body: 'x' })
      .expect(401);
  });

  it('POST creates a root comment with Location /comments/:id', async () => {
    const response = await comment({}).expect(201);

    expect(response.headers.location).toBe(`/comments/${response.body.id}`);
    expect(response.body).toMatchObject({
      parentId: null,
      author: { handle: 'ada' },
    });

    await request(app.getHttpServer())
      .get(`/comments/${response.body.id}`)
      .expect(200);
  });

  it('POST returns 422 for an empty body', async () => {
    await comment({ body: '' }).expect(422);
  });

  it('POST returns 404 for an unknown post', async () => {
    await request(app.getHttpServer())
      .post('/posts/00000000-0000-0000-0000-000000000000/comments')
      .set(auth())
      .send({ body: 'x' })
      .expect(404);
  });

  it('replies to a root comment but not to a reply (422)', async () => {
    const root = await comment({}).expect(201);
    const reply = await comment({
      body: 'Resposta',
      parentId: root.body.id,
    }).expect(201);

    await comment({ body: 'Neta', parentId: reply.body.id }).expect(422);
  });

  it('GET returns roots with their replies embedded, publicly', async () => {
    const root = await comment({ body: 'Raiz' });
    await comment({ body: 'Resposta', parentId: root.body.id });

    const response = await request(app.getHttpServer())
      .get(`/posts/${postId}/comments`)
      .expect(200);

    expect(response.body).toHaveLength(1);
    expect(response.body[0].replies[0].body).toBe('Resposta');
  });

  it('GET returns 400 for a malformed id', async () => {
    await request(app.getHttpServer()).get('/posts/abc/comments').expect(400);
  });
});
