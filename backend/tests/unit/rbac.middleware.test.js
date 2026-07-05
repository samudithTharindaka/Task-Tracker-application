const { authorize } = require('../../src/middleware/rbac.middleware');
const { ApiError } = require('../../src/middleware/error.middleware');

describe('authorize', () => {
  it('rejects when there is no authenticated user', () => {
    const next = jest.fn();
    authorize(['ADMIN'])({}, {}, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(next.mock.calls[0][0].statusCode).toBe(401);
  });

  it('rejects a user whose role is not in the allowed list', () => {
    const next = jest.fn();
    authorize(['ADMIN'])({ user: { role: 'USER' } }, {}, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(next.mock.calls[0][0].statusCode).toBe(403);
  });

  it('calls next with no error for an allowed role', () => {
    const next = jest.fn();
    authorize(['ADMIN', 'USER'])({ user: { role: 'USER' } }, {}, next);

    expect(next).toHaveBeenCalledWith();
  });
});
