const { odataQuery } = require('../../src/middleware/odata-query.middleware');
const { ApiError } = require('../../src/middleware/error.middleware');

describe('odataQuery', () => {
  it("forces where.ownerId to the caller's id for a USER", () => {
    const req = { query: {}, user: { id: 'user-1', role: 'USER' } };
    const next = jest.fn();

    odataQuery(req, {}, next);

    expect(req.odataQuery.where.ownerId).toBe('user-1');
    expect(next).toHaveBeenCalledWith();
  });

  it("overrides a USER's own ownerId filter attempt with their real id", () => {
    const req = { query: { $filter: "ownerId eq 'someone-else'" }, user: { id: 'user-1', role: 'USER' } };
    const next = jest.fn();

    odataQuery(req, {}, next);

    expect(req.odataQuery.where.ownerId).toBe('user-1');
  });

  it('leaves the where clause untouched for an ADMIN', () => {
    const req = { query: {}, user: { id: 'admin-1', role: 'ADMIN' } };
    const next = jest.fn();

    odataQuery(req, {}, next);

    expect(req.odataQuery.where.ownerId).toBeUndefined();
    expect(next).toHaveBeenCalledWith();
  });

  it('forwards a parse error to next instead of throwing', () => {
    const req = { query: { $filter: "title eq 'x'" }, user: { id: 'user-1', role: 'USER' } };
    const next = jest.fn();

    odataQuery(req, {}, next);

    expect(next.mock.calls[0][0]).toBeInstanceOf(ApiError);
    expect(req.odataQuery).toBeUndefined();
  });
});
