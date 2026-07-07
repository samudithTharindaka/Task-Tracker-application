jest.mock('../../src/config/prisma');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const prisma = require('../../src/config/prisma');
const env = require('../../src/config/env');
const app = require('../../src/app');

function tokenFor(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiry });
}

const owner = { id: 'user-1', role: 'USER' };
const otherUser = { id: 'user-2', role: 'USER' };
const ownerAuth = () => `Bearer ${tokenFor(owner)}`;

describe('auth guard', () => {
  it('rejects requests with no token', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/projects', () => {
  it('returns a paginated envelope', async () => {
    prisma.project.findMany.mockResolvedValue([{ id: 'project-1', name: 'My Board', ownerId: owner.id }]);
    prisma.project.count.mockResolvedValue(1);

    const res = await request(app).get('/api/projects').set('Authorization', ownerAuth());

    expect(res.status).toBe(200);
    expect(res.body.value).toHaveLength(1);
    expect(res.body.pagination).toEqual({
      page: 1,
      limit: 20,
      totalItems: 1,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
      nextPage: null,
      previousPage: null,
    });
    expect(prisma.project.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { ownerId: owner.id }, skip: 0, take: 20 }),
    );
  });

  it('honors page/limit', async () => {
    prisma.project.findMany.mockResolvedValue([]);
    prisma.project.count.mockResolvedValue(0);

    const res = await request(app)
      .get('/api/projects?page=3&limit=5')
      .set('Authorization', ownerAuth());

    expect(res.status).toBe(200);
    expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 10, take: 5 }));
  });

  it('rejects an invalid page with 400', async () => {
    const res = await request(app).get('/api/projects?page=0').set('Authorization', ownerAuth());
    expect(res.status).toBe(400);
  });

  it('rejects an invalid limit with 400', async () => {
    const res = await request(app).get('/api/projects?limit=-1').set('Authorization', ownerAuth());
    expect(res.status).toBe(400);
  });
});

describe('POST /api/projects', () => {
  it('rejects a missing name with 400', async () => {
    const res = await request(app).post('/api/projects').set('Authorization', ownerAuth()).send({});
    expect(res.status).toBe(400);
  });

  it('creates a project owned by the caller', async () => {
    prisma.project.create.mockResolvedValue({ id: 'project-1', name: 'My Board', ownerId: owner.id });

    const res = await request(app).post('/api/projects').set('Authorization', ownerAuth()).send({ name: 'My Board' });

    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({ id: 'project-1', name: 'My Board', ownerId: owner.id });
  });
});

describe('GET /api/projects/:id', () => {
  it('returns 400 for a non-uuid id', async () => {
    const res = await request(app).get('/api/projects/not-a-uuid').set('Authorization', ownerAuth());
    expect(res.status).toBe(400);
  });

  it('returns 404 when the project does not exist', async () => {
    prisma.project.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .get('/api/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth());

    expect(res.status).toBe(404);
  });

  it("returns 403 for another user's project", async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: otherUser.id });

    const res = await request(app)
      .get('/api/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth());

    expect(res.status).toBe(403);
  });
});

describe('PUT /api/projects/:id', () => {
  it('returns 400 for a non-uuid id', async () => {
    const res = await request(app)
      .put('/api/projects/not-a-uuid')
      .set('Authorization', ownerAuth())
      .send({ name: 'Renamed' });
    expect(res.status).toBe(400);
  });

  it('renames a project the caller owns', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: owner.id });
    prisma.project.update.mockResolvedValue({ id: 'project-1', name: 'Renamed', ownerId: owner.id });

    const res = await request(app)
      .put('/api/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth())
      .send({ name: 'Renamed' });

    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Renamed');
  });
});

describe('DELETE /api/projects/:id', () => {
  it('returns 400 for a non-uuid id', async () => {
    const res = await request(app).delete('/api/projects/not-a-uuid').set('Authorization', ownerAuth());
    expect(res.status).toBe(400);
  });

  it('deletes a project the caller owns', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: owner.id });

    const res = await request(app)
      .delete('/api/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth());

    expect(res.status).toBe(204);
    expect(prisma.project.delete).toHaveBeenCalled();
  });

  it("returns 403 deleting another user's project", async () => {
    prisma.project.findUnique.mockResolvedValue({ id: 'project-1', ownerId: otherUser.id });

    const res = await request(app)
      .delete('/api/projects/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth());

    expect(res.status).toBe(403);
  });
});
