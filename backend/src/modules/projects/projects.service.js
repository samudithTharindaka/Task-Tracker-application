const prisma = require('../../config/prisma');
const { ApiError } = require('../../middleware/error.middleware');
const { isOwnerOrAdmin } = require('../users/users.service');

async function listProjects(user) {
  const where = user.role === 'ADMIN' ? {} : { ownerId: user.id };
  return prisma.project.findMany({ where, orderBy: { createdAt: 'asc' } });
}

async function getProjectById(user, id) {
  const project = await prisma.project.findUnique({ where: { id } });

  if (!project) {
    throw new ApiError(404, 'NOT_FOUND', 'Project not found');
  }

  if (!isOwnerOrAdmin(user, project.ownerId)) {
    throw new ApiError(403, 'FORBIDDEN', 'You do not have access to this project');
  }

  return project;
}

async function createProject(user, { name }) {
  return prisma.project.create({ data: { name, ownerId: user.id } });
}

async function updateProject(user, id, { name }) {
  await getProjectById(user, id);
  return prisma.project.update({ where: { id }, data: { name } });
}

async function deleteProject(user, id) {
  const project = await getProjectById(user, id);
  await prisma.project.delete({ where: { id } });
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
