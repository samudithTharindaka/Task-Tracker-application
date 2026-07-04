const { z } = require('zod');
const tasksService = require('./tasks.service');
const { buildODataResponse } = require('../../utils/odata-response.util');

const TASK_STATUSES = ['PENDING', 'IN_PROGRESS', 'DONE'];

const idParamSchema = z.object({
  id: z.string().uuid('Invalid task id'),
});

const createTaskSchema = z.object({
  title: z.string().min(1, 'title is required'),
  description: z.string().optional().nullable(),
  status: z.enum(TASK_STATUSES).optional(),
  dueDate: z.coerce.date({ required_error: 'dueDate is required' }),
});

const updateTaskSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(TASK_STATUSES).optional(),
    dueDate: z.coerce.date().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided',
  });

async function list(req, res, next) {
  try {
    const { items, count } = await tasksService.listTasks(req.odataQuery);
    res.status(200).json(buildODataResponse('/api/tasks', count, items));
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
