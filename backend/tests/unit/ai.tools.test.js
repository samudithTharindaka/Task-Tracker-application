jest.mock('../../src/modules/tasks/tasks.service');
jest.mock('../../src/modules/projects/projects.service');

const tasksService = require('../../src/modules/tasks/tasks.service');
const projectsService = require('../../src/modules/projects/projects.service');
const { TOOL_HANDLERS } = require('../../src/modules/ai/ai.tools');

const owner = { id: 'user-1', role: 'USER' };
const admin = { id: 'admin-1', role: 'ADMIN' };
const OTHER_USER_ID = '33333333-3333-3333-3333-333333333333';
const TASK_ID = '22222222-2222-2222-2222-222222222222';
const PROJECT_ID = '11111111-1111-1111-1111-111111111111';

describe('search_tasks', () => {
  it("forces where.ownerId to the caller's id for a USER, even if args.ownerId names someone else", async () => {
    tasksService.listTasks.mockResolvedValue({ items: [], count: 0 });

    await TOOL_HANDLERS.search_tasks(owner, { ownerId: OTHER_USER_ID });

    expect(tasksService.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ownerId: owner.id }) }),
    );
  });

  it('honors an explicit ownerId arg for ADMIN', async () => {
    tasksService.listTasks.mockResolvedValue({ items: [], count: 0 });

    await TOOL_HANDLERS.search_tasks(admin, { ownerId: OTHER_USER_ID });

    expect(tasksService.listTasks).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ ownerId: OTHER_USER_ID }) }),
    );
  });

  it('leaves ownerId unrestricted for ADMIN when not provided', async () => {
    tasksService.listTasks.mockResolvedValue({ items: [], count: 0 });

    await TOOL_HANDLERS.search_tasks(admin, {});

    const { where } = tasksService.listTasks.mock.calls[0][0];
    expect(where.ownerId).toBeUndefined();
  });

  it('builds a keyword OR clause across title/description', async () => {
    tasksService.listTasks.mockResolvedValue({ items: [], count: 0 });

    await TOOL_HANDLERS.search_tasks(owner, { keyword: 'invoice' });

    const { where } = tasksService.listTasks.mock.calls[0][0];
    expect(where.OR).toEqual([
      { title: { contains: 'invoice', mode: 'insensitive' } },
      { description: { contains: 'invoice', mode: 'insensitive' } },
    ]);
  });

  it('defaults take to 10 and rejects a take above the cap', async () => {
    tasksService.listTasks.mockResolvedValue({ items: [], count: 0 });

    await TOOL_HANDLERS.search_tasks(owner, {});
    expect(tasksService.listTasks.mock.calls[0][0].take).toBe(10);

    await expect(TOOL_HANDLERS.search_tasks(owner, { take: 999 })).rejects.toThrow();
  });

  it('rejects an invalid status value', async () => {
    await expect(TOOL_HANDLERS.search_tasks(owner, { status: 'NOT_A_STATUS' })).rejects.toThrow();
    expect(tasksService.listTasks).not.toHaveBeenCalled();
  });
});

describe('create_task', () => {
  it('delegates to tasksService.createTask and marks mutated', async () => {
    const data = { title: 'New task', dueDate: '2026-12-31', projectId: PROJECT_ID };
    const created = { id: 'task-1', ...data, ownerId: owner.id };
    tasksService.createTask.mockResolvedValue(created);

    const result = await TOOL_HANDLERS.create_task(owner, data);

    expect(tasksService.createTask).toHaveBeenCalledWith(owner, expect.objectContaining({ title: 'New task', projectId: PROJECT_ID }));
    expect(result).toEqual({ task: created, mutated: true });
  });

  it('rejects missing required fields', async () => {
    await expect(TOOL_HANDLERS.create_task(owner, { title: 'No due date or project' })).rejects.toThrow();
    expect(tasksService.createTask).not.toHaveBeenCalled();
  });
});

describe('update_task', () => {
  it('delegates to tasksService.updateTask and marks mutated', async () => {
    const updated = { id: TASK_ID, status: 'DONE' };
    tasksService.updateTask.mockResolvedValue(updated);

    const result = await TOOL_HANDLERS.update_task(owner, { taskId: TASK_ID, status: 'DONE' });

    expect(tasksService.updateTask).toHaveBeenCalledWith(owner, TASK_ID, { status: 'DONE' });
    expect(result).toEqual({ task: updated, mutated: true });
  });

  it('rejects a body with only taskId and no fields to change', async () => {
    await expect(TOOL_HANDLERS.update_task(owner, { taskId: TASK_ID })).rejects.toThrow();
    expect(tasksService.updateTask).not.toHaveBeenCalled();
  });
});

describe('delete_task', () => {
  it('resolves+authorizes the task via getTaskById but never deletes it', async () => {
    tasksService.getTaskById.mockResolvedValue({ id: TASK_ID, title: 'Old task', ownerId: owner.id });

    const result = await TOOL_HANDLERS.delete_task(owner, { taskId: TASK_ID });

    expect(tasksService.getTaskById).toHaveBeenCalledWith(owner, TASK_ID);
    expect(tasksService.deleteTask).not.toHaveBeenCalled();
    expect(result).toEqual({ requiresConfirmation: true, taskId: TASK_ID, title: 'Old task' });
  });

  it('propagates a 403/404 from getTaskById', async () => {
    tasksService.getTaskById.mockRejectedValue(Object.assign(new Error('nope'), { statusCode: 403 }));

    await expect(TOOL_HANDLERS.delete_task(owner, { taskId: TASK_ID })).rejects.toMatchObject({ statusCode: 403 });
  });
});

describe('list_projects', () => {
  it('delegates to projectsService.listProjects', async () => {
    const projects = [{ id: PROJECT_ID, name: 'My Board' }];
    projectsService.listProjects.mockResolvedValue(projects);

    const result = await TOOL_HANDLERS.list_projects(owner);

    expect(projectsService.listProjects).toHaveBeenCalledWith(owner);
    expect(result).toEqual({ projects });
  });
});
