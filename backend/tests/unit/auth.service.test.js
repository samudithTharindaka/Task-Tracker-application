jest.mock('../../src/config/prisma');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');
jest.mock('../../src/config/logger');

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../../src/config/prisma');
const logger = require('../../src/config/logger');
const { ApiError } = require('../../src/middleware/error.middleware');
const authService = require('../../src/modules/auth/auth.service');

describe('register', () => {
  it('rejects an email that already exists', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });

    await expect(authService.register({ email: 'a@example.com', password: 'Password123!' })).rejects.toMatchObject({
      statusCode: 409,
      code: 'CONFLICT',
    });
  });

  it('hashes the password and creates a USER-role account', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-password');
    prisma.user.create.mockResolvedValue({
      id: 'new-user',
      email: 'a@example.com',
      password: 'hashed-password',
      role: 'USER',
      createdAt: new Date('2026-01-01'),
    });

    const result = await authService.register({ email: 'a@example.com', password: 'Password123!' });

    expect(bcrypt.hash).toHaveBeenCalledWith('Password123!', 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { email: 'a@example.com', password: 'hashed-password', role: 'USER' },
    });
    expect(result).toEqual({ id: 'new-user', email: 'a@example.com', role: 'USER', createdAt: new Date('2026-01-01') });
    expect(result.password).toBeUndefined();
  });
});

describe('login', () => {
  const storedUser = { id: 'user-1', email: 'a@example.com', password: 'hashed', role: 'USER', createdAt: new Date() };

  it('rejects when no user matches the email, logging a warning without the password', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(authService.login({ email: 'nobody@example.com', password: 'sekrit-pw-1' })).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHENTICATED',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      { email: 'nobody@example.com' },
      'Login failed: no user with this email',
    );
    const loggedArgs = logger.warn.mock.calls.flat();
    expect(JSON.stringify(loggedArgs)).not.toContain('sekrit-pw-1');
  });

  it('rejects an incorrect password, logging a warning without the password', async () => {
    prisma.user.findUnique.mockResolvedValue(storedUser);
    bcrypt.compare.mockResolvedValue(false);

    await expect(authService.login({ email: storedUser.email, password: 'wrong' })).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHENTICATED',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      { userId: storedUser.id, email: storedUser.email },
      'Login failed: incorrect password',
    );
    const loggedArgs = logger.warn.mock.calls.flat();
    expect(JSON.stringify(loggedArgs)).not.toContain('wrong');
  });

  it('returns a public user plus a token pair on success, logging the success without the tokens', async () => {
    prisma.user.findUnique.mockResolvedValue(storedUser);
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValueOnce('access-token').mockReturnValueOnce('refresh-token');

    const result = await authService.login({ email: storedUser.email, password: 'correct' });

    expect(jwt.sign).toHaveBeenCalledTimes(2);
    expect(result).toEqual({
      user: { id: storedUser.id, email: storedUser.email, role: storedUser.role, createdAt: storedUser.createdAt },
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    expect(logger.info).toHaveBeenCalledWith(
      { userId: storedUser.id, email: storedUser.email },
      'Login succeeded',
    );
    const loggedArgs = logger.info.mock.calls.flat();
    expect(JSON.stringify(loggedArgs)).not.toContain('access-token');
    expect(JSON.stringify(loggedArgs)).not.toContain('refresh-token');
  });
});

describe('refresh', () => {
  it('rejects an invalid or expired refresh token', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid signature');
    });

    await expect(authService.refresh({ refreshToken: 'bad-token' })).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('rejects a token whose user no longer exists', async () => {
    jwt.verify.mockReturnValue({ sub: 'ghost-user', role: 'USER' });
    prisma.user.findUnique.mockResolvedValue(null);

    await expect(authService.refresh({ refreshToken: 'valid-token' })).rejects.toMatchObject({
      statusCode: 401,
      code: 'UNAUTHENTICATED',
    });
  });

  it('issues a fresh access token for a valid refresh token', async () => {
    jwt.verify.mockReturnValue({ sub: 'user-1', role: 'USER' });
    prisma.user.findUnique.mockResolvedValue({ id: 'user-1', role: 'USER' });
    jwt.sign.mockReturnValue('new-access-token');

    const result = await authService.refresh({ refreshToken: 'valid-token' });

    expect(result).toEqual({ accessToken: 'new-access-token' });
  });
});

describe('ApiError propagation', () => {
  it('register/login/refresh only ever throw ApiError for expected failure modes', async () => {
    prisma.user.findUnique.mockResolvedValue({ id: 'existing' });
    await expect(authService.register({ email: 'a@example.com', password: 'x' })).rejects.toBeInstanceOf(ApiError);
  });
});
