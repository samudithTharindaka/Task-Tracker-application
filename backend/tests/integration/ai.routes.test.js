jest.mock('../../src/config/prisma');
jest.mock('../../src/config/openai');

const request = require('supertest');
const jwt = require('jsonwebtoken');
const prisma = require('../../src/config/prisma');
const openaiMock = require('../../src/config/openai');
const env = require('../../src/config/env');
const app = require('../../src/app');

function tokenFor(user) {
  return jwt.sign({ sub: user.id, role: user.role }, env.jwtAccessSecret, { expiresIn: env.jwtAccessExpiry });
}

const owner = { id: '11111111-1111-1111-1111-111111111111', role: 'USER' };
const otherUser = { id: '22222222-2222-2222-2222-222222222222', role: 'USER' };
const admin = { id: '33333333-3333-3333-3333-333333333333', role: 'ADMIN' };
const ownerAuth = () => `Bearer ${tokenFor(owner)}`;
const adminAuth = () => `Bearer ${tokenFor(admin)}`;
const TASK_ID = '44444444-4444-4444-4444-444444444444';

function toolCallResponse(name, args, id = 'call_1') {
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: null,
          tool_calls: [{ id, type: 'function', function: { name, arguments: JSON.stringify(args) } }],
        },
      },
    ],
  };
}

function finalResponse(content) {
  return { choices: [{ message: { role: 'assistant', content, tool_calls: undefined } }] };
}

describe('auth guard', () => {
  it('rejects requests with no token', async () => {
    const res = await request(app).post('/api/ai/chat').send({ message: 'hi' });
    expect(res.status).toBe(401);
  });
});

describe('POST /api/ai/chat', () => {
  it('rejects an empty message', async () => {
    const res = await request(app).post('/api/ai/chat').set('Authorization', ownerAuth()).send({ message: '' });
    expect(res.status).toBe(400);
  });

  it("forces a USER's search to their own tasks even when the model's tool call names another user's id", async () => {
    openaiMock.chat.completions.create
      .mockResolvedValueOnce(toolCallResponse('search_tasks', { ownerId: otherUser.id }))
      .mockResolvedValueOnce(finalResponse('Here are your tasks.'));
    prisma.task.findMany.mockResolvedValue([{ id: 'task-1', ownerId: owner.id }]);
    prisma.task.count.mockResolvedValue(1);

    const res = await request(app).post('/api/ai/chat').set('Authorization', ownerAuth()).send({ message: 'show me every task' });

    expect(res.status).toBe(200);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ownerId: owner.id }) }),
    );
  });

  it("lets an ADMIN search another user's tasks by explicit ownerId", async () => {
    openaiMock.chat.completions.create
      .mockResolvedValueOnce(toolCallResponse('search_tasks', { ownerId: otherUser.id }))
      .mockResolvedValueOnce(finalResponse('Here they are.'));
    prisma.task.findMany.mockResolvedValue([]);
    prisma.task.count.mockResolvedValue(0);

    const res = await request(app)
      .post('/api/ai/chat')
      .set('Authorization', adminAuth())
      .send({ message: "show user 2's tasks" });

    expect(res.status).toBe(200);
    expect(prisma.task.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ownerId: otherUser.id }) }),
    );
  });

  it('a delete tool call surfaces pendingDelete and never deletes the task', async () => {
    openaiMock.chat.completions.create
      .mockResolvedValueOnce(toolCallResponse('delete_task', { taskId: TASK_ID }))
      .mockResolvedValueOnce(finalResponse('Please confirm the deletion.'));
    prisma.task.findUnique.mockResolvedValue({ id: TASK_ID, ownerId: owner.id, title: 'Old task' });

    const res = await request(app).post('/api/ai/chat').set('Authorization', ownerAuth()).send({ message: 'delete that task' });

    expect(res.status).toBe(200);
    expect(res.body.pendingDelete).toEqual({ taskId: TASK_ID, title: 'Old task' });
    expect(prisma.task.delete).not.toHaveBeenCalled();
  });

  it("403s a delete confirmation attempt on another user's task, still without deleting", async () => {
    openaiMock.chat.completions.create.mockResolvedValueOnce(toolCallResponse('delete_task', { taskId: TASK_ID }));
    openaiMock.chat.completions.create.mockResolvedValueOnce(finalResponse("You don't have access to that task."));
    prisma.task.findUnique.mockResolvedValue({ id: TASK_ID, ownerId: otherUser.id, title: "Someone else's task" });

    const res = await request(app).post('/api/ai/chat').set('Authorization', ownerAuth()).send({ message: 'delete that task' });

    expect(res.status).toBe(200);
    expect(res.body.pendingDelete).toBeFalsy();
    expect(prisma.task.delete).not.toHaveBeenCalled();
  });
});

// The 503 AI_UNAVAILABLE path (no OPENAI_API_KEY configured) is covered at
// the unit level in tests/unit/ai.service.test.js — reproducing it here
// would require jest.resetModules() + re-requiring app.js mid-test, which
// re-triggers config/__mocks__/prisma.js's top-level beforeEach() during
// test execution ("Hooks cannot be defined inside tests").
