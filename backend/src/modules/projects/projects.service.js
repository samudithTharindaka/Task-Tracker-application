const prisma = require('../../config/prisma');
const { ApiError } = require('../../middleware/error.middleware');
const { isOwnerOrAdmin } = require('../users/users.service');
const logger = require('../../config/logger');

// `pagination` is optional — internal callers (e.g. ai.tools.js) that just
// want every project the caller can see omit it and get an unbounded list;
// the HTTP endpoint (projects.controller.js) always passes it via
// middleware/pagination.middleware.js.
async function listProjects(user, pagination) {
  const where = user.role === 'ADMIN' ? {} : { ownerId: user.id };
  const { skip, take } = pagination ?? {};

  const [items, count] = await Promise.all([
    prisma.project.findMany({ where, orderBy: { createdAt: 'asc' }, skip, take }),
    prisma.project.count({ where }),
  ]);

  return { items, count };
}

async function getProjectById(user, id) {
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) {
    throw new ApiError(404, 'NOT_FOUND', 'Project not found');
  }

  if (!isOwnerOrAdmin(user, project.ownerId)) {
    logger.warn({ userId: user.id, projectId: id, ownerId: project.ownerId }, 'Forbidden: project access denied');
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this project');
  }

  return project;
}

async function createProject(user, { name }) {
  const project = await prisma.project.create({ data: { name, ownerId: user.id } });

  logger.info({ userId: user.id, projectId: project.id }, 'Project created');

  return project;
}

async function updateProject(user, id, { name }) {
  await getProjectById(user, id);
  const project = await prisma.project.update({ where: { id }, data: { name } });

  logger.info({ userId: user.id, projectId: id }, 'Project updated');

  return project;
}

async function deleteProject(user, id) {
  const project = await getProjectById(user, id);
  await prisma.project.delete({ where: { id } });

  logger.info({ userId: user.id, projectId: id }, 'Project deleted');

  return project;
}

// Used by tasks.service.js to make sure a task can only be filed under a
// project the requesting user actually owns (or any project, for admins).
async function assertProjectAccess(user, projectId) {
  await getProjectById(user, projectId);
}

module.exports = {
  listProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  assertProjectAccess,
};
