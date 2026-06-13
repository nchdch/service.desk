import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../src/app.module';

interface LoginResponseBody {
  accessToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    organizationId: string | null;
  };
}

interface MeResponseBody {
  id: string;
  email: string;
  name: string;
  role: string;
  organizationId: string | null;
}

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let password: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    password = process.env.SEED_USER_PASSWORD ?? '';
    if (!password) {
      throw new Error('SEED_USER_PASSWORD is not set (проверьте backend/.env)');
    }
  });

  afterAll(async () => {
    await app.close();
  });

  it('logs in each seeded user and returns an access token', async () => {
    for (const email of [
      'admin@virtualoff.local',
      'manager@virtualoff.local',
      'engineer@virtualoff.local',
      'client@virtualoff.local',
    ]) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password })
        .expect(201);

      const body = res.body as LoginResponseBody;
      expect(body.accessToken).toBeDefined();
      expect(body.user.email).toBe(email);
    }
  });

  it('rejects login with a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'admin@virtualoff.local', password: 'wrong-password' })
      .expect(401);
  });

  it('returns the current user on /auth/me with a valid token', async () => {
    const loginRes = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'engineer@virtualoff.local', password })
      .expect(201);

    const loginBody = loginRes.body as LoginResponseBody;

    const res = await request(app.getHttpServer())
      .get('/auth/me')
      .set('Authorization', `Bearer ${loginBody.accessToken}`)
      .expect(200);

    const body = res.body as MeResponseBody;
    expect(body.email).toBe('engineer@virtualoff.local');
    expect(body.role).toBe('ENGINEER');
  });

  it('rejects /auth/me without a token', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);
  });
});
