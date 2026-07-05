const prisma = require('../../config/prisma');
const { ApiError } = require('../../middleware/error.middleware');
const { isOwnerOrAdmin } = require('../users/users.service');
const { assertProjectAccess } = require('../projects/projects.service');
const { emitTaskEvent } = require('../../sockets');

async function listTasks(odataQuery) {
  const { where, orderBy, skip, take } = odataQuery;

  const [items, count] = await Promise.all([
    prisma.task.findMany({ where, orderBy, skip, take }),
    prisma.task.count({ where }),
  ]);

  return { items, count };
}

async function getTaskById(user, id) {
  const task = await prisma.task.findUnique({ where: { id } });

  if (!task) {
    throw new ApiError(404, 'NOT_FOUND', 'Task not found');
  }

  if (!isOwnerOrAdmin(user, task.ownerId)) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this task');
  }

  return task;
}

async function createTask(user, data) {
  await assertProjectAccess(user, data.projectId);

  const task = await prisma.task.create({
    data: { ...data, ownerId: user.id },
  });

  emitTaskEvent('task:created', task);

  return task;
}

async function updateTask(user, id, data) {
  const existing = await prisma.task.findUnique({ where: { id } });

  if (!existing) {
    throw new ApiError(404, 'NOT_FOUND', 'Task not found');
  }

  if (!isOwnerOrAdmin(user, existing.ownerId)) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this task');
  }

  if (data.projectId) {
    await assertProjectAccess(user, data.projectId);
  }

  const task = await prisma.task.update({ where: { id }, data });

  emitTaskEvent('task:updated', task);

  return task;
}

async function deleteTask(user, id) {
  const existing = await prisma.task.findUnique({ where: { id } });

  if (!existing) {
    throw new ApiError(404, 'NOT_FOUND', 'Task not found');
  }

  if (!isOwnerOrAdmin(user, existing.ownerId)) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this task');
  }

  await prisma.task.delete({ where: { id } });

  emitTaskEvent('task:deleted', existing);

  return existing;
}

module.exports = { listTasks, getTaskById, createTask, updateTask, deleteTask };
