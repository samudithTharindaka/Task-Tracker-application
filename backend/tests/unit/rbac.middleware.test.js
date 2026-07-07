jest.mock('../../src/config/logger');

const { authorize } = require('../../src/middleware/rbac.middleware');
const { ApiError } = require('../../src/middleware/error.middleware');
const logger = require('../../src/config/logger');

describe('authorize', () => {
  it('rejects when there is no authenticated user', () => {
    const next = jest.fn();
    authorize(['ADMIN'])({}, {}, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('rejects a user whose role is not in the allowed list, logging a warning', () => {
    const next = jest.fn();
    authorize(['ADMIN'])({ user: { id: 'user-1', role: 'USER' }, path: '/api/admin-only' }, {}, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
    expect(logger.warn).toHaveBeenCalledWith(
      { userId: 'user-1', role: 'USER', allowedRoles: ['ADMIN'], path: '/api/admin-only' },
      'Forbidden: insufficient role',
    );
  });

  it('calls next with no error for an allowed role', () => {
    const next = jest.fn();
    authorize(['ADMIN', 'USER'])({ user: { role: 'USER' } }, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
