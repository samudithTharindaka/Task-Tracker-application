jest.mock('../../src/config/prisma');

const prisma = require('../../src/config/prisma');
const { findById, isOwnerOrAdmin } = require('../../src/modules/users/users.service');

describe('findById', () => {
  it('looks the user up by id', async () => {
    const user = { id: 'user-1', email: 'a@example.com' };
    prisma.user.findUnique.mockResolvedValue(user);

    const result = await findById('user-1');

    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-1' } });
    expect(result).toBe(user);
  });
});

describe('isOwnerOrAdmin', () => {
  it('is true for an admin regardless of ownership', () => {
    expect(isOwnerOrAdmin({ id: 'user-1', role: 'ADMIN' }, 'someone-else')).toBe(true);
  });

  it('is true when the user owns the resource', () => {
    expect(isOwnerOrAdmin({ id: 'user-1', role: 'USER' }, 'user-1')).toBe(true);
  });

  it('is false for a non-admin who does not own the resource', () => {
    expect(isOwnerOrAdmin({ id: 'user-1', role: 'USER' }, 'user-2')).toBe(false);
  });
});
