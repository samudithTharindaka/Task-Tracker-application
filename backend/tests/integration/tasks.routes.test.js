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
const admin = { id: 'admin-1', role: 'ADMIN' };
const ownerAuth = () => `Bearer ${tokenFor(owner)}`;
const PROJECT_ID = '11111111-1111-1111-1111-111111111111';
const UNKNOWN_PROJECT_ID = '22222222-2222-2222-2222-222222222222';

describe('auth guard', () => {
  it('rejects requests with no token', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });

  it('rejects requests with a garbage token', async () => {
    const res = await request(app).get('/api/tasks').set('Authorization', 'Bearer garbage');
    expect(res.status).toBe(401);
  });
});

describe('GET /api/tasks', () => {
  it('returns an OData envelope and forces ownerId scoping for a USER', async () => {
    prisma.task.findMany.mockResolvedValue([{ id: 'task-1', ownerId: owner.id }]);
    prisma.task.count.mockResolvedValue(1);

    const res = await request(app).get('/api/tasks').set('Authorization', ownerAuth());

    expect(res.status).toBe(200);
    expect(res.body['@odata.count']).toBe(1);
    expect(res.body.value).toHaveLength(1);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ownerId: owner.id }) }),
    );
  });

  it("ignores a USER's attempt to filter by someone else's ownerId", async () => {
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    await request(app)
      .get(`/api/tasks?$filter=ownerId eq '${otherUser.id}'`)
      .set('Authorization', ownerAuth());

    // The middleware overwrites ownerId with the caller's own id regardless
    // of what was requested.
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ownerId: owner.id }) }),
    );
  });

  it('rejects an unsupported $filter field with 400', async () => {
    const res = await request(app).get("/api/tasks?$filter=title eq 'x'").set('Authorization', ownerAuth());
    expect(res.status).toBe(400);
  });
});

describe('POST /api/tasks', () => {
  it('rejects a payload missing required fields', async () => {
    const res = await request(app).post('/api/tasks').set('Authorization', ownerAuth()).send({ title: 'No due date' });
    expect(res.status).toBe(400);
  });

  it('rejects the removed PENDING status value', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', ownerAuth())
      .send({ title: 'x', status: 'PENDING', dueDate: '2026-12-31', projectId: PROJECT_ID });

    expect(res.status).toBe(400);
  });

  it('creates a task under a project the caller owns', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: PROJECT_ID, ownerId: owner.id });
    prisma.task.create.mockResolvedValue({
      id: 'task-1',
      title: 'Buy milk',
      status: 'TODO',
      label: 'Development',
      projectId: PROJECT_ID,
      ownerId: owner.id,
      owner: { id: owner.id, email: 'owner@example.com' },
    });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', ownerAuth())
      .send({ title: 'Buy milk', dueDate: '2026-12-31', projectId: PROJECT_ID });

    expect(res.status).toBe(201);
    expect(res.body.ownerId).toBe(owner.id);
    expect(res.body.owner).toEqual({ id: owner.id, email: 'owner@example.com' });
    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ ownerId: owner.id, projectId: PROJECT_ID }) }),
    );
  });

  it('accepts a valid label and rejects an invalid one', async () => {
    prisma.project.findUnique.mockResolvedValue({ id: PROJECT_ID, ownerId: owner.id });
    prisma.task.create.mockResolvedValue({ id: 'task-1', label: 'UI/UX' });

    const ok = await request(app)
      .post('/api/tasks')
      .set('Authorization', ownerAuth())
      .send({ title: 'Design pass', dueDate: '2026-12-31', projectId: PROJECT_ID, label: 'UI/UX' });
    expect(ok.status).toBe(201);

    const bad = await request(app)
      .post('/api/tasks')
      .set('Authorization', ownerAuth())
      .send({ title: 'x', dueDate: '2026-12-31', projectId: PROJECT_ID, label: 'Not A Label' });
    expect(bad.status).toBe(400);
  });

  it("returns 403 when the project belongs to someone else", async () => {
    prisma.project.findUnique.mockResolvedValue({ id: PROJECT_ID, ownerId: otherUser.id });

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', ownerAuth())
      .send({ title: 'Buy milk', dueDate: '2026-12-31', projectId: PROJECT_ID });

    expect(res.status).toBe(403);
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it('returns 404 when the project does not exist', async () => {
    prisma.project.findUnique.mockResolvedValue(null);

    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', ownerAuth())
      .send({ title: 'Buy milk', dueDate: '2026-12-31', projectId: UNKNOWN_PROJECT_ID });

    expect(res.status).toBe(404);
  });
});

describe('GET /api/tasks/:id', () => {
  it('returns 400 for a non-uuid id', async () => {
    const res = await request(app).get('/api/tasks/not-a-uuid').set('Authorization', ownerAuth());
    expect(res.status).toBe(400);
  });

  it('returns 404 when the task does not exist', async () => {
    prisma.task.findUnique.mockResolvedValue(null);
    const res = await request(app)
      .get('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth());
    expect(res.status).toBe(404);
  });

  it("returns 403 for another user's task", async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', ownerId: otherUser.id });
    const res = await request(app)
      .get('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth());
    expect(res.status).toBe(403);
  });

  it("lets an admin read another user's task", async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', ownerId: otherUser.id });
    const res = await request(app)
      .get('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', `Bearer ${tokenFor(admin)}`);
    expect(res.status).toBe(200);
  });
});

describe('PUT /api/tasks/:id', () => {
  it('rejects an empty update body', async () => {
    const res = await request(app)
      .put('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth())
      .send({});
    expect(res.status).toBe(400);
  });

  it('updates a task the caller owns', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', ownerId: owner.id });
    prisma.task.update.mockResolvedValue({ id: 'task-1', status: 'TEST', ownerId: owner.id });

    const res = await request(app)
      .put('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth())
      .send({ status: 'TEST' });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('TEST');
  });
});

describe('DELETE /api/tasks/:id', () => {
  it('deletes a task the caller owns', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', ownerId: owner.id });

    const res = await request(app)
      .delete('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth());

    expect(res.status).toBe(204);
    expect(prisma.task.delete).toHaveBeenCalled();
  });

  it("returns 403 deleting another user's task", async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', ownerId: otherUser.id });

    const res = await request(app)
      .delete('/api/tasks/00000000-0000-0000-0000-000000000000')
      .set('Authorization', ownerAuth());

    expect(res.status).toBe(403);
  });
});
