const { z } = require('zod');
const tasksService = require('./tasks.service');
const { buildPaginatedResponse } = require('../../utils/pagination-response.util');

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'TEST', 'DONE'];
const TASK_LABELS = ['Development', 'QA', 'UI/UX', 'Planing', 'Other', 'Dev Ops'];

const idParamSchema = z.object({
  id: z.string().uuid('Invalid task id'),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional().nullable(),
  status: z.enum(TASK_STATUSES).optional(),
  label: z.enum(TASK_LABELS).optional(),
  dueDate: z.coerce.date({ required_error: 'dueDate is required' }),
  projectId: z.string().uuid('Invalid project id'),
});

const updateTaskSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(TASK_STATUSES).optional(),
    label: z.enum(TASK_LABELS).optional(),
    dueDate: z.coerce.date().optional(),
    projectId: z.string().uuid('Invalid project id').optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

async function list(req, res, next) {
  try {
    const { items, count } = await tasksService.listTasks(req.odataQuery);
    const { page, limit } = req.odataQuery;
    res.status(200).json(buildPaginatedResponse(items, { page, limit, totalItems: count }));
  } catch (err) {
    next(err);
  }
}

async function getById(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const task = await tasksService.getTaskById(req.user, id);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

async function create(req, res, next) {
  try {
    const data = createTaskSchema.parse(req.body);
    const task = await tasksService.createTask(req.user, data);
    res.status(201).json(task);
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    const data = updateTaskSchema.parse(req.body);
    const task = await tasksService.updateTask(req.user, id, data);
    res.status(200).json(task);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = idParamSchema.parse(req.params);
    await tasksService.deleteTask(req.user, id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

module.exports = { list, getById, create, update, remove };
