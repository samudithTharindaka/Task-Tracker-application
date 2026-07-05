const jwt = require('jsonwebtoken');
const { authenticate } = require('../../src/middleware/auth.middleware');
const { ApiError } = require('../../src/middleware/error.middleware');
const env = require('../../src/config/env');

describe('authenticate', () => {
  it('rejects a request with no Authorization header', () => {
    const next = jest.fn();
    authenticate({ headers: {} }, {}, next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(401);
  });

  it('rejects a header that is not a Bearer token', () => {
    const next = jest.fn();
    authenticate({ headers: { authorization: 'Basic abc123' } }, {}, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('rejects an invalid or expired token', () => {
    const next = jest.fn();
    authenticate({ headers: { authorization: 'Bearer not-a-real-token' } }, {}, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('attaches req.user and calls next with no error for a valid token', () => {
    const token = jwt.sign({ sub: 'user-1', role: 'ADMIN' }, env.jwtAccessSecret, {
      expiresIn: env.jwtAccessExpiry,
    });
    const req = { headers: { authorization: `Bearer ${token}` } };
    const next = jest.fn();

    authenticate(req, {}, next);

    expect(req.user).toEqual({ id: 'user-1', role: 'ADMIN' });
    expect(next).toHaveBeenCalledWith();
  });
});
