const prisma = require('../../config/prisma');
const { ApiError } = require('../../middleware/error.middleware');
const { isOwnerOrAdmin } = require('../users/users.service');
const { assertProjectAccess } = require('../projects/projects.service');
const { emitTaskEvent } = require('../../sockets');
const logger = require('../../config/logger');

// Every read embeds the real owner's id/email so the frontend can show the
// task's actual owner (Board avatar, List "User" column) instead of falling
// back to decorative mock data for tasks the viewer doesn't own themselves.
const OWNER_INCLUDE = { owner: { select: { id: true, email: true } } };

async function listTasks(odataQuery) {
  const { where, orderBy, skip, take } = odataQuery;

  const [items, count] = await Promise.all([
    prisma.task.findMany({ where, orderBy, skip, take, include: OWNER_INCLUDE }),
    prisma.task.count({ where }),
  ]);

  return { items, count };
}

async function getTaskById(user, id) {
  const task = await prisma.task.findUnique({ where: { id }, include: OWNER_INCLUDE });

  if (!task) {
    throw new ApiError(404, 'NOT_FOUND', 'Task not found');
  }

  if (!isOwnerOrAdmin(user, task.ownerId)) {
    logger.warn({ userId: user.id, taskId: id, ownerId: task.ownerId }, 'Forbidden: task access denied');
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this task');
  }

  return task;
}

async function createTask(user, data) {
  await assertProjectAccess(user, data.projectId);

  const task = await prisma.task.create({
    data: { ...data, ownerId: user.id },
    include: OWNER_INCLUDE,
  });

  emitTaskEvent('task:created', task);

  logger.info({ userId: user.id, taskId: task.id, projectId: task.projectId }, 'Task created');

  return task;
}

async function updateTask(user, id, data) {
  const existing = await prisma.task.findUnique({ where: { id } });

  if (!existing) {
    throw new ApiError(404, 'NOT_FOUND', 'Task not found');
  }

  if (!isOwnerOrAdmin(user, existing.ownerId)) {
    logger.warn({ userId: user.id, taskId: id, ownerId: existing.ownerId }, 'Forbidden: task update denied');
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this task');
  }

  if (data.projectId) {
    await assertProjectAccess(user, data.projectId);
  }

  const task = await prisma.task.update({ where: { id }, data, include: OWNER_INCLUDE });

  emitTaskEvent('task:updated', task);

  logger.info({ userId: user.id, taskId: task.id, fields: Object.keys(data) }, 'Task updated');

  return task;
}

async function deleteTask(user, id) {
  const existing = await prisma.task.findUnique({ where: { id }, include: OWNER_INCLUDE });

  if (!existing) {
    throw new ApiError(404, 'NOT_FOUND', 'Task not found');
  }

  if (!isOwnerOrAdmin(user, existing.ownerId)) {
    logger.warn({ userId: user.id, taskId: id, ownerId: existing.ownerId }, 'Forbidden: task delete denied');
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this task');
  }

  await prisma.task.delete({ where: { id } });

  emitTaskEvent('task:deleted', existing);

  logger.info({ userId: user.id, taskId: id }, 'Task deleted');

  return existing;
}

module.exports = { listTasks, getTaskById, createTask, updateTask, deleteTask };
