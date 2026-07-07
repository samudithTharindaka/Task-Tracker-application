jest.mock('../../src/config/prisma');
jest.mock('../../src/modules/projects/projects.service');
jest.mock('../../src/sockets');
jest.mock('../../src/config/logger');

const prisma = require('../../src/config/prisma');
const { assertProjectAccess } = require('../../src/modules/projects/projects.service');
const { emitTaskEvent } = require('../../src/sockets');
const logger = require('../../src/config/logger');
const tasksService = require('../../src/modules/tasks/tasks.service');

const owner = { id: 'user-1', role: 'USER' };
const admin = { id: 'admin-1', role: 'ADMIN' };
const OWNER_INCLUDE = { owner: { select: { id: true, email: true } } };

describe('listTasks', () => {
  it('runs findMany and count with the given odata query and returns both', async () => {
    const odataQuery = { where: { ownerId: 'user-1' }, orderBy: [{ dueDate: 'desc' }], skip: 0, take: 20 };
    const items = [{ id: 'task-1' }];
    prisma.task.findMany.mockResolvedValue(items);
    prisma.task.count.mockResolvedValue(1);

    const result = await tasksService.listTasks(odataQuery);

    expect(prisma.task.findMany).toHaveBeenCalledWith({
      where: odataQuery.where,
      orderBy: odataQuery.orderBy,
      skip: 0,
      take: 20,
      include: OWNER_INCLUDE,
    });
    expect(prisma.task.count).toHaveBeenCalledWith({ where: odataQuery.where });
    expect(result).toEqual({ items, count: 1 });
  });
});

describe('getTaskById', () => {
  it('throws 404 when the task does not exist', async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    await expect(tasksService.getTaskById(owner, 'missing')).rejects.toMatchObject({
      statusCode: 404,
      code: 'NOT_FOUND',
    });
  });

  it('throws 403 when a non-owner, non-admin requests the task, logging a warning', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', ownerId: 'someone-else' });

    await expect(tasksService.getTaskById(owner, 'task-1')).rejects.toMatchObject({
      statusCode: 403,
      code: 'FORBIDDEN',
    });
    expect(logger.warn).toHaveBeenCalledWith(
      { userId: owner.id, taskId: 'task-1', ownerId: 'someone-else' },
      'Forbidden: task access denied',
    );
  });

  it('returns the task for its owner', async () => {
    const task = { id: 'task-1', ownerId: owner.id };
    prisma.task.findUnique.mockResolvedValue(task);

    await expect(tasksService.getTaskById(owner, 'task-1')).resolves.toBe(task);
  });

  it('returns the task for an admin who is not the owner', async () => {
    const task = { id: 'task-1', ownerId: 'someone-else' };
    prisma.task.findUnique.mockResolvedValue(task);

    await expect(tasksService.getTaskById(admin, 'task-1')).resolves.toBe(task);
  });
});

describe('createTask', () => {
  it('checks project access, creates the task under the caller, and emits an event', async () => {
    const data = { title: 'New task', dueDate: new Date(), projectId: 'project-1' };
    const created = { id: 'task-1', ...data, ownerId: owner.id };
    prisma.task.create.mockResolvedValue(created);

    const result = await tasksService.createTask(owner, data);

    expect(assertProjectAccess).toHaveBeenCalledWith(owner, 'project-1');
    expect(prisma.task.create).toHaveBeenCalledWith({
      data: { ...data, ownerId: owner.id },
      include: OWNER_INCLUDE,
    });
    expect(emitTaskEvent).toHaveBeenCalledWith('task:created', created);
    expect(logger.info).toHaveBeenCalledWith(
      { userId: owner.id, taskId: created.id, projectId: created.projectId },
      'Task created',
    );
    expect(result).toBe(created);
  });

  it('propagates the project-access error without creating a task', async () => {
    assertProjectAccess.mockRejectedValue(Object.assign(new Error('nope'), { statusCode: 404 }));

    await expect(tasksService.createTask(owner, { projectId: 'not-mine' })).rejects.toMatchObject({ statusCode: 404 });
    expect(prisma.task.create).not.toHaveBeenCalled();
  });

  it('passes a provided label straight through to prisma', async () => {
    const data = { title: 'x', dueDate: new Date(), projectId: 'project-1', label: 'QA' };
    prisma.task.create.mockResolvedValue({ id: 'task-1', ...data, ownerId: owner.id });

    await tasksService.createTask(owner, data);

    expect(prisma.task.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ label: 'QA' }) }),
    );
  });
});

describe('updateTask', () => {
  it('throws 404 when the task does not exist', async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    await expect(tasksService.updateTask(owner, 'missing', { title: 'x' })).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 for a non-owner, non-admin, logging a warning', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', ownerId: 'someone-else' });

    await expect(tasksService.updateTask(owner, 'task-1', { title: 'x' })).rejects.toMatchObject({ statusCode: 403 });
    expect(logger.warn).toHaveBeenCalledWith(
      { userId: owner.id, taskId: 'task-1', ownerId: 'someone-else' },
      'Forbidden: task update denied',
    );
  });

  it('updates without re-checking project access when projectId is unchanged', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', ownerId: owner.id });
    const updated = { id: 'task-1', status: 'DONE' };
    prisma.task.update.mockResolvedValue(updated);

    const result = await tasksService.updateTask(owner, 'task-1', { status: 'DONE' });

    expect(assertProjectAccess).not.toHaveBeenCalled();
    expect(prisma.task.update).toHaveBeenCalledWith({
      where: { id: 'task-1' },
      data: { status: 'DONE' },
      include: OWNER_INCLUDE,
    });
    expect(emitTaskEvent).toHaveBeenCalledWith('task:updated', updated);
    expect(logger.info).toHaveBeenCalledWith(
      { userId: owner.id, taskId: updated.id, fields: ['status'] },
      'Task updated',
    );
    expect(result).toBe(updated);
  });

  it('re-checks project access when moving the task to a new project', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', ownerId: owner.id });
    prisma.task.update.mockResolvedValue({ id: 'task-1', projectId: 'project-2' });

    await tasksService.updateTask(owner, 'task-1', { projectId: 'project-2' });

    expect(assertProjectAccess).toHaveBeenCalledWith(owner, 'project-2');
  });
});

describe('deleteTask', () => {
  it('throws 404 when the task does not exist', async () => {
    prisma.task.findUnique.mockResolvedValue(null);

    await expect(tasksService.deleteTask(owner, 'missing')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('throws 403 for a non-owner, non-admin, logging a warning', async () => {
    prisma.task.findUnique.mockResolvedValue({ id: 'task-1', ownerId: 'someone-else' });

    await expect(tasksService.deleteTask(owner, 'task-1')).rejects.toMatchObject({ statusCode: 403 });
    expect(logger.warn).toHaveBeenCalledWith(
      { userId: owner.id, taskId: 'task-1', ownerId: 'someone-else' },
      'Forbidden: task delete denied',
    );
  });

  it('deletes the task, emits an event, and returns the deleted task', async () => {
    const existing = { id: 'task-1', ownerId: owner.id };
    prisma.task.findUnique.mockResolvedValue(existing);

    const result = await tasksService.deleteTask(owner, 'task-1');

    expect(prisma.task.delete).toHaveBeenCalledWith({ where: { id: 'task-1' } });
    expect(emitTaskEvent).toHaveBeenCalledWith('task:deleted', existing);
    expect(logger.info).toHaveBeenCalledWith({ userId: owner.id, taskId: 'task-1' }, 'Task deleted');
    expect(result).toBe(existing);
  });
});
