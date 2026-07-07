const { z } = require('zod');
const projectsService = require('./projects.service');
const { buildPaginatedResponse } = require('../../utils/pagination-response.util');

const idParamSchema = z.object({
  id: z.string().uuid('Invalid project id'),
});

const createProjectSchema = z.object({
  name: z.string().min(1, 'name is required'),
});

async function list(req, res, next) {
  try {
    const { items, count } = await projectsService.listProjects(req.user, req.pagination);
    const { page, limit } = req.pagination;
    res.status(200).json(buildPaginatedResponse(items, { page, limit, totalItems: count }));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const project = await projectsService.getProjectById(req.user, id);
    res.status(200).json(project);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = createProjectSchema.parse(req.body);
    const project = await projectsService.createProject(req.user, data);
    res.status(201).json(project);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = createProjectSchema.parse(req.body);
    const project = await projectsService.updateProject(req.user, id, data);
    res.status(200).json(project);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    await projectsService.deleteProject(req.user, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
