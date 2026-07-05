const { ApiError, notFoundHandler, errorHandler } = require('../../src/middleware/error.middleware');

function mockRes() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('ApiError', () => {
  it('carries statusCode and code alongside the message', () => {
    const err = new ApiError(403, 'FORBIDDEN', 'nope');
    expect(err).toBeInstanceOf(Error);
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe('FORBIDDEN');
    expect(err.message).toBe('nope');
  });
});

describe('notFoundHandler', () => {
  it('forwards a 404 ApiError to next', () => {
    const next = jest.fn();
    notFoundHandler({}, mockRes(), next);

    expect(next).toHaveBeenCalledTimes(1);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(ApiError);
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe('NOT_FOUND');
  });
});

describe('errorHandler', () => {
  it('formats a ZodError as 400 VALIDATION_ERROR', () => {
    const res = mockRes();
    const zodLikeError = { name: 'ZodError', issues: [{ path: ['email'], message: 'Invalid email' }] };

    errorHandler(zodLikeError, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Validation failed', code: 'VALIDATION_ERROR', details: zodLikeError.issues },
    });
  });

  it('formats an ApiError using its own statusCode and code', () => {
    const res = mockRes();
    const err = new ApiError(403, 'FORBIDDEN', 'You do not have access to this task');

    errorHandler(err, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'You do not have access to this task', code: 'FORBIDDEN' },
    });
  });

  it('formats a Prisma P2002 unique-constraint error as 409 CONFLICT', () => {
    const res = mockRes();
    errorHandler({ code: 'P2002' }, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'A record with this value already exists', code: 'CONFLICT' },
    });
  });

  it('formats a Prisma P2025 not-found error as 404 NOT_FOUND', () => {
    const res = mockRes();
    errorHandler({ code: 'P2025' }, {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Resource not found', code: 'NOT_FOUND' },
    });
  });

  it('falls back to a 500 for anything unrecognized', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = mockRes();

    errorHandler(new Error('boom'), {}, res, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    });
    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});
