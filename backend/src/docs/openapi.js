const env = require('../config/env');

const errorResponse = (description) => ({
  description,
  content: {
    'application/json': {
      schema: { $ref: '#/components/schemas/Error' },
    },
  },
});

const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Task Tracker API',
    version: '1.0.0',
    description:
      'REST API for the Task Tracker application. JWT bearer auth (access + refresh tokens), ' +
      'role-based access control (USER/ADMIN), and OData-style query support on the task list endpoint.',
  },
  servers: [
    { url: `http://localhost:${env.port}/api`, description: 'Local dev server' },
  ],
  tags: [
    { name: 'Auth', description: 'Registration, login, and token refresh' },
    { name: 'Tasks', description: 'Task CRUD and OData-style listing' },
    { name: 'Projects', description: 'Project listing and creation' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Access token returned by /auth/login or /auth/refresh',
      },
    },
    schemas: {
      Error: {
        type: 'object',
        properties: {
          error: {
            type: 'object',
            properties: {
              message: { type: 'string', example: 'Invalid email or password' },
              code: { type: 'string', example: 'UNAUTHENTICATED' },
            },
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          email: { type: 'string', format: 'email' },
          role: { type: 'string', enum: ['USER', 'ADMIN'] },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      Task: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'TEST', 'DONE'] },
          dueDate: { type: 'string', format: 'date-time' },
          ownerId: { type: 'string', format: 'uuid' },
          projectId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
          updatedAt: { type: 'string', format: 'date-time' },
        },
      },
      Project: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          ownerId: { type: 'string', format: 'uuid' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      ProjectCreateRequest: {
        type: 'object',
        required: ['name'],
        properties: {
          name: { type: 'string', example: 'My Board' },
        },
      },
      ProjectListResponse: {
        type: 'object',
        properties: {
          value: {
            type: 'array',
            items: { $ref: '#/components/schemas/Project' },
          },
        },
      },
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string', minLength: 8, example: 'Password123!' },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      LoginResponse: {
        type: 'object',
        properties: {
          user: { $ref: '#/components/schemas/User' },
          accessToken: { type: 'string' },
          refreshToken: { type: 'string' },
        },
      },
      RefreshRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string' },
        },
      },
      RefreshResponse: {
        type: 'object',
        properties: {
          accessToken: { type: 'string' },
        },
      },
      TaskCreateRequest: {
        type: 'object',
        required: ['title', 'dueDate', 'projectId'],
        properties: {
          title: { type: 'string', example: 'Write API docs' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'TEST', 'DONE'] },
          dueDate: { type: 'string', format: 'date-time' },
          projectId: { type: 'string', format: 'uuid' },
        },
      },
      TaskUpdateRequest: {
        type: 'object',
        description: 'At least one field must be provided',
        properties: {
          title: { type: 'string' },
          description: { type: 'string', nullable: true },
          status: { type: 'string', enum: ['TODO', 'IN_PROGRESS', 'TEST', 'DONE'] },
          dueDate: { type: 'string', format: 'date-time' },
          projectId: { type: 'string', format: 'uuid' },
        },
      },
      TaskListResponse: {
        type: 'object',
        properties: {
          '@odata.context': { type: 'string', example: '/api/tasks' },
          '@odata.count': { type: 'integer', example: 6 },
          value: {
            type: 'array',
            items: { $ref: '#/components/schemas/Task' },
          },
        },
      },
    },
  },
  paths: {
    '/auth/register': {
      post: {
        tags: ['Auth'],
        summary: 'Register a new user (always created with role USER)',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RegisterRequest' } } },
        },
        responses: {
          201: {
            description: 'User created',
            content: {
              'application/json': {
                schema: { type: 'object', properties: { user: { $ref: '#/components/schemas/User' } } },
              },
            },
          },
          400: errorResponse('Validation error'),
          409: errorResponse('Email already registered'),
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Log in and receive an access + refresh token pair',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: {
          200: {
            description: 'Login successful',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginResponse' } } },
          },
          400: errorResponse('Validation error'),
          401: errorResponse('Invalid credentials'),
        },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Exchange a refresh token for a new access token',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshRequest' } } },
        },
        responses: {
          200: {
            description: 'New access token issued',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/RefreshResponse' } } },
          },
          400: errorResponse('Validation error'),
          401: errorResponse('Invalid or expired refresh token'),
        },
      },
    },
    '/tasks': {
      get: {
        tags: ['Tasks'],
        summary: 'List tasks (OData-style filter/sort/paginate)',
        description:
          'USER role is always restricted to their own tasks server-side, regardless of any ownerId ' +
          'filter passed in $filter. ADMIN role may see and filter across all tasks.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: '$filter',
            in: 'query',
            description: "Supports 'eq' on status and ownerId, combinable with 'and'.",
            schema: { type: 'string' },
            example: "status eq 'DONE' and ownerId eq 'b0138fe3-ebe5-49eb-a031-06295238f3f3'",
          },
          {
            name: '$top',
            in: 'query',
            description: 'Page size (max 100, default 20)',
            schema: { type: 'integer', default: 20 },
          },
          {
            name: '$skip',
            in: 'query',
            description: 'Offset (default 0)',
            schema: { type: 'integer', default: 0 },
          },
          {
            name: '$orderby',
            in: 'query',
            description: 'Field + direction, e.g. "dueDate desc"',
            schema: { type: 'string' },
            example: 'dueDate desc',
          },
        ],
        responses: {
          200: {
            description: 'Paged task list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskListResponse' } } },
          },
          400: errorResponse('Invalid query parameters'),
          401: errorResponse('Missing or invalid access token'),
        },
      },
      post: {
        tags: ['Tasks'],
        summary: 'Create a task (ownerId is always the authenticated user)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskCreateRequest' } } },
        },
        responses: {
          201: {
            description: 'Task created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } },
          },
          400: errorResponse('Validation error'),
          401: errorResponse('Missing or invalid access token'),
        },
      },
    },
    '/tasks/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        tags: ['Tasks'],
        summary: 'Get a task by id (owner or admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Task found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } },
          },
          401: errorResponse('Missing or invalid access token'),
          403: errorResponse('Not the owner and not an admin'),
          404: errorResponse('Task not found'),
        },
      },
      put: {
        tags: ['Tasks'],
        summary: 'Update a task (owner or admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/TaskUpdateRequest' } } },
        },
        responses: {
          200: {
            description: 'Task updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Task' } } },
          },
          400: errorResponse('Validation error'),
          401: errorResponse('Missing or invalid access token'),
          403: errorResponse('Not the owner and not an admin'),
          404: errorResponse('Task not found'),
        },
      },
      delete: {
        tags: ['Tasks'],
        summary: 'Delete a task (owner or admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Task deleted' },
          401: errorResponse('Missing or invalid access token'),
          403: errorResponse('Not the owner and not an admin'),
          404: errorResponse('Task not found'),
        },
      },
    },
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'List projects (own projects for USER, all for ADMIN)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Project list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectListResponse' } } },
          },
          401: errorResponse('Missing or invalid access token'),
        },
      },
      post: {
        tags: ['Projects'],
        summary: 'Create a project (ownerId is always the authenticated user)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectCreateRequest' } } },
        },
        responses: {
          201: {
            description: 'Project created',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } },
          },
          400: errorResponse('Validation error'),
          401: errorResponse('Missing or invalid access token'),
        },
      },
    },
    '/projects/{id}': {
      parameters: [
        { name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
      ],
      get: {
        tags: ['Projects'],
        summary: 'Get a project by id (owner or admin only)',
        security: [{ bearerAuth: [] }],
        responses: {
          200: {
            description: 'Project found',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } },
          },
          401: errorResponse('Missing or invalid access token'),
          403: errorResponse('Not the owner and not an admin'),
          404: errorResponse('Project not found'),
        },
      },
    },
  },
};

module.exports = openapiSpec;
