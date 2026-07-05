jest.mock('../../src/config/prisma');

const request = require('supertest');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../src/config/prisma');
const env = require('../../src/config/env');
const app = require('../../src/app');

describe('POST /api/auth/register', () => {
  it('rejects an invalid payload with 400', async () => {
    const res = await request(app).post('/api/auth/register').send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('creates a USER-role account and never returns the password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      password: 'hashed',
      role: 'USER',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'Password123!' });

    expect(res.status).toBe(201);
    expect(res.body.user).toMatchObject({ id: 'user-1', email: 'alice@example.com', role: 'USER' });
    expect(res.body.user.password).toBeUndefined();
  });

  it('returns 409 when the email is already registered', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'alice@example.com', password: 'Password123!' });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe('CONFLICT');
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token pair for correct credentials', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      password: passwordHash,
      role: 'USER',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'Password123!' });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('alice@example.com');
  });

  it('returns 401 for an unknown email', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    const res = await request(app).post('/api/auth/login').send({ email: 'nobody@example.com', password: 'x' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for the wrong password', async () => {
    const passwordHash = await bcrypt.hash('Password123!', 10);
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'alice@example.com',
      password: passwordHash,
      role: 'USER',
      createdAt: new Date(),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@example.com', password: 'wrong-password' });

    expect(res.status).toBe(401);
  });
});

describe('POST /api/auth/refresh', () => {
  it('issues a new access token for a valid refresh token', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'USER' });
    const refreshToken = jwt.sign({ sub: 'user-1', role: 'USER' }, env.jwtRefreshSecret, {
      expiresIn: env.jwtRefreshExpiry,
    });

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
  });

  it('returns 401 for a malformed refresh token', async () => {
    const res = await request(app).post('/api/auth/refresh').send({ refreshToken: 'garbage' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for a refresh token signed with the wrong secret', async () => {
    const refreshToken = jwt.sign({ sub: 'user-1', role: 'USER' }, 'wrong-secret', { expiresIn: '7d' });

    const res = await request(app).post('/api/auth/refresh').send({ refreshToken });

    expect(res.status).toBe(401);
  });
});
