import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { sql } from 'drizzle-orm';
import request from 'supertest';
import { AppModule } from '../src/app.module.js';
import { DRIZZLE, type Database } from '../src/database/database.constants.js';

describe('Users (e2e)', () => {
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
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /users creates a user without leaking the password', async () => {
    const response = await request(app.getHttpServer())
      .post('/users')
      .send({
        name: 'Ada Lovelace',
        email: 'ada@example.com',
        password: 'super-secret-1',
      })
      .expect(201);

    expect(response.headers.location).toBe(`/users/${response.body.id}`);
    expect(response.body).toEqual({
      id: expect.any(String),
      name: 'Ada Lovelace',
      email: 'ada@example.com',
    });
  });

  it('POST /users returns 409 for a duplicate email', async () => {
    const payload = {
      name: 'Ada Lovelace',
      email: 'ada@example.com',
      password: 'super-secret-1',
    };

    await request(app.getHttpServer()).post('/users').send(payload).expect(201);

    await request(app.getHttpServer()).post('/users').send(payload).expect(409);
  });

  it('POST /users returns 422 for an invalid payload', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ name: '', email: 'not-an-email', password: 'short' })
      .expect(422);
  });
});
