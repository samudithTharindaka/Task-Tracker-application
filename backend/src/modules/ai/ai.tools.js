const { z } = require('zod');
const tasksService = require('../tasks/tasks.service');
const projectsService = require('../projects/projects.service');

const TASK_STATUSES = ['TODO', 'IN_PROGRESS', 'TEST', 'DONE'];

const searchTasksSchema = z.object({
  status: z.enum(TASK_STATUSES).optional(),
  projectId: z.string().uuid().optional(),
  keyword: z.string().optional(),
  dueBefore: z.coerce.date().optional(),
  dueAfter: z.coerce.date().optional(),
  // Only ever honored for ADMIN callers — see the role check below.
  ownerId: z.string().uuid().optional(),
  take: z.coerce.number().int().min(1).max(25).optional(),
});

async function searchTasks(user, rawArgs) {
  const args = searchTasksSchema.parse(rawArgs ?? {});
  const where = {};

  if (args.status) where.status = args.status;
  if (args.projectId) where.projectId = args.projectId;
  if (args.keyword) {
    where.OR = [
      { title: { contains: args.keyword, mode: 'insensitive' } },
      { description: { contains: args.keyword, mode: 'insensitive' } },
    ];
  }
  if (args.dueBefore || args.dueAfter) {
    where.dueDate = {};
    if (args.dueBefore) where.dueDate.lte = args.dueBefore;
    if (args.dueAfter) where.dueDate.gte = args.dueAfter;
  }

  // Forced, not merely defaulted: a USER's search can never surface another
  // user's tasks, even if the model's tool-call args hallucinate an
  // `ownerId` — mirrors middleware/odata-query.middleware.js exactly. Only
  // an ADMIN's explicit ownerId arg is honored (e.g. "show user X's tasks");
  // otherwise ADMIN searches are unrestricted, same as the REST list endpoint.
  if (user.role === 'USER') {
    where.ownerId = user.id;
  } else if (args.ownerId) {
    where.ownerId = args.ownerId;
  }

  const { items, count } = await tasksService.listTasks({
    where,
    orderBy: [{ dueDate: 'asc' }],
    skip: 0,
    take: args.take ?? 10,
  });

  return { count, tasks: items };
}

const createTaskSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional().nullable(),
  status: z.enum(TASK_STATUSES).optional(),
  dueDate: z.coerce.date(),
  projectId: z.string().uuid(),
});

async function createTask(user, rawArgs) {
  const data = createTaskSchema.parse(rawArgs ?? {});
  // tasksService.createTask already sets ownerId: user.id and calls
  // assertProjectAccess — reused as-is, not re-implemented here.
  const task = await tasksService.createTask(user, data);
  return { task, mutated: true };
}

const updateTaskSchema = z
  .object({
    taskId: z.string().uuid(),
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    status: z.enum(TASK_STATUSES).optional(),
    dueDate: z.coerce.date().optional(),
    projectId: z.string().uuid().optional(),
  })
  .refine((data) => Object.keys(data).some((key) => key !== 'taskId'), {
    message: 'At least one field besides taskId must be provided',
  });

async function updateTask(user, rawArgs) {
  const { taskId, ...fields } = updateTaskSchema.parse(rawArgs ?? {});
  const task = await tasksService.updateTask(user, taskId, fields);
  return { task, mutated: true };
}

const deleteTaskSchema = z.object({
  taskId: z.string().uuid(),
});

async function deleteTask(user, rawArgs) {
  const { taskId } = deleteTaskSchema.parse(rawArgs ?? {});
  // Resolves + authorizes (404/403) via the existing service, but never
  // actually deletes — the model can only identify the task. The real
  // deletion happens later through the existing DELETE /api/tasks/:id
  // endpoint once a human explicitly confirms (see ai.service.js).
  const task = await tasksService.getTaskById(user, taskId);
  return { requiresConfirmation: true, taskId: task.id, title: task.title };
}

async function listProjects(user) {
  const projects = await projectsService.listProjects(user);
  return { projects };
}

const TOOL_DEFINITIONS = [
  {
    type: 'function',
    function: {
      name: 'search_tasks',
      description: "Search the caller's tasks (or, for admins, optionally any user's tasks) with optional filters.",
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: TASK_STATUSES, description: 'Filter by exact task status' },
          projectId: { type: 'string', format: 'uuid', description: 'Filter by project id' },
          keyword: { type: 'string', description: 'Case-insensitive substring match against title or description' },
          dueBefore: { type: 'string', format: 'date', description: 'Only tasks due on or before this date (ISO 8601)' },
          dueAfter: { type: 'string', format: 'date', description: 'Only tasks due on or after this date (ISO 8601)' },
          ownerId: {
            type: 'string',
            format: 'uuid',
            description: "Admin-only: restrict results to a specific user's tasks. Ignored for non-admin callers.",
          },
          take: { type: 'integer', minimum: 1, maximum: 25, description: 'Max results to return (default 10)' },
        },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'create_task',
      description: 'Create a new task owned by the calling user.',
      parameters: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: TASK_STATUSES },
          dueDate: { type: 'string', format: 'date', description: 'ISO 8601 date' },
          projectId: { type: 'string', format: 'uuid' },
        },
        required: ['title', 'dueDate', 'projectId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'update_task',
      description: 'Update one or more fields of an existing task the caller has access to.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string' },
          status: { type: 'string', enum: TASK_STATUSES },
          dueDate: { type: 'string', format: 'date' },
          projectId: { type: 'string', format: 'uuid' },
        },
        required: ['taskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'delete_task',
      description:
        'Identify a task for deletion. This does NOT delete it — it only resolves and authorizes the task so the human can be asked to confirm.',
      parameters: {
        type: 'object',
        properties: {
          taskId: { type: 'string', format: 'uuid' },
        },
        required: ['taskId'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'list_projects',
      description: "List the caller's projects (or, for admins, every project).",
      parameters: { type: 'object', properties: {} },
    },
  },
];

const TOOL_HANDLERS = {
  search_tasks: searchTasks,
  create_task: createTask,
  update_task: updateTask,
  delete_task: deleteTask,
  list_projects: (user) => listProjects(user),
};

module.exports = { TOOL_DEFINITIONS, TOOL_HANDLERS, TASK_STATUSES };
