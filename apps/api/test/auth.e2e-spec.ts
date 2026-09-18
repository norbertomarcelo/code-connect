import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { DRIZZLE, type Database } from '../src/database/database.constants.js';

describe('Auth (e2e)', () => {
  let app: INestApplication;

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
    await app.get<Database>(DRIZZLE).execute(sql`TRUNCATE users`);

    await request(app.getHttpServer()).post('/users').send({
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'super-secret-1',
    });
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /auth/login logs in and returns an access token', async () => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ada@example.com', password: 'super-secret-1' })
      .expect(200);

    expect(response.body).toEqual({
      accessToken: expect.any(String),
      expiresAt: expect.any(String),
      user: {
        id: expect.any(String),
        name: 'Ada Lovelace',
        email: 'ada@example.com',
      },
    });
  });

  it('POST /auth/login returns 401 for a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ada@example.com', password: 'wrong-password' })
      .expect(401);
  });

  it('POST /auth/login returns 422 for an invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'not-an-email', password: '' })
      .expect(422);
  });

  it('GET /auth/me returns the current user for a valid token', async () => {
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'ada@example.com', password: 'super-secret-1' });

    const response = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
      .expect(200);

    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });

  it('GET /auth/me returns 401 without a token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });

  it('GET /auth/me returns 401 for an invalid token', async () => {
    await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', 'Bearer not-a-real-token')
      .expect(401);
  });
});
