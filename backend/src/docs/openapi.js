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
    { name: 'Ai', description: 'Conversational task/project search and management assistant' },
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
              details: {
                type: 'array',
                description: 'Present only on 400 VALIDATION_ERROR responses — the raw Zod issues array',
                items: { type: 'object' },
              },
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
          label: { type: 'string', enum: ['Development', 'QA', 'UI/UX', 'Planing', 'Other', 'Dev Ops'] },
          dueDate: { type: 'string', format: 'date-time' },
          ownerId: { type: 'string', format: 'uuid' },
          owner: {
            type: 'object',
            description: "The task owner's id/email, embedded so clients can display the real owner without a separate lookup",
            properties: {
              id: { type: 'string', format: 'uuid' },
              email: { type: 'string', format: 'email' },
            },
          },
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
      Pagination: {
        type: 'object',
        properties: {
          page: { type: 'integer', example: 2 },
          limit: { type: 'integer', example: 10 },
          totalItems: { type: 'integer', example: 47 },
          totalPages: { type: 'integer', example: 5 },
          hasNextPage: { type: 'boolean' },
          hasPreviousPage: { type: 'boolean' },
          nextPage: { type: 'integer', nullable: true, example: 3 },
          previousPage: { type: 'integer', nullable: true, example: 1 },
        },
      },
      ProjectListResponse: {
        type: 'object',
        properties: {
          value: {
            type: 'array',
            items: { $ref: '#/components/schemas/Project' },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
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
          label: { type: 'string', enum: ['Development', 'QA', 'UI/UX', 'Planing', 'Other', 'Dev Ops'] },
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
          label: { type: 'string', enum: ['Development', 'QA', 'UI/UX', 'Planing', 'Other', 'Dev Ops'] },
          dueDate: { type: 'string', format: 'date-time' },
          projectId: { type: 'string', format: 'uuid' },
        },
      },
      TaskListResponse: {
        type: 'object',
        properties: {
          value: {
            type: 'array',
            items: { $ref: '#/components/schemas/Task' },
          },
          pagination: { $ref: '#/components/schemas/Pagination' },
        },
      },
      AiChatRequest: {
        type: 'object',
        required: ['message'],
        properties: {
          message: { type: 'string', example: "What's due this week?" },
          history: {
            type: 'array',
            maxItems: 20,
            description: 'Recent prior turns of the conversation, oldest first',
            items: {
              type: 'object',
              properties: {
                role: { type: 'string', enum: ['user', 'assistant'] },
                content: { type: 'string' },
              },
            },
          },
          projectId: {
            type: 'string',
            format: 'uuid',
            description: "The currently open project in the UI, used as a default for create/search actions",
          },
        },
      },
      AiChatResponse: {
        type: 'object',
        properties: {
          reply: { type: 'string' },
          mutated: { type: 'boolean', description: 'True if the assistant created or updated a task this turn' },
          pendingDelete: {
            type: 'object',
            nullable: true,
            description: 'Present when the assistant identified a task to delete — the actual delete still requires the user to confirm via DELETE /tasks/{id}',
            properties: {
              taskId: { type: 'string', format: 'uuid' },
              title: { type: 'string' },
            },
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
        summary: 'List tasks (OData-style filter/sort, page/limit pagination)',
        description:
          'USER role is always restricted to their own tasks server-side, regardless of any ownerId ' +
          'filter passed in $filter. ADMIN role may see and filter across all tasks.',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: '$filter',
            in: 'query',
            description:
              "Supports 'eq' on status, ownerId, projectId, and label, combinable with 'and'. " +
              "status must be one of TODO/IN_PROGRESS/TEST/DONE; label must be one of " +
              "Development/QA/UI/UX/Planing/Other/Dev Ops.",
            schema: { type: 'string' },
            example: "status eq 'DONE' and label eq 'QA'",
          },
          {
            name: 'page',
            in: 'query',
            description: '1-indexed page number (default 1)',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Page size (max 100, default 20)',
            schema: { type: 'integer', default: 20 },
          },
          {
            name: '$orderby',
            in: 'query',
            description:
              'Field + direction (default direction asc), e.g. "dueDate desc". Comma-separate for ' +
              'multiple sort keys. Sortable fields: title, status, dueDate, createdAt, updatedAt, ownerId.',
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
        description: 'projectId must reference a project the caller owns (or, for ADMIN, any project).',
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
          403: errorResponse('projectId belongs to a project the caller does not own'),
          404: errorResponse('projectId does not reference an existing project'),
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
        description:
          'If projectId is included, it must reference a project the caller owns (or, for ADMIN, any project).',
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
        summary: 'List projects, paginated (own projects for USER, all for ADMIN)',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'page',
            in: 'query',
            description: '1-indexed page number (default 1)',
            schema: { type: 'integer', default: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            description: 'Page size (max 100, default 20)',
            schema: { type: 'integer', default: 20 },
          },
        ],
        responses: {
          200: {
            description: 'Paged project list',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectListResponse' } } },
          },
          400: errorResponse('Invalid query parameters'),
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
      put: {
        tags: ['Projects'],
        summary: 'Rename a project (owner or admin only)',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/ProjectCreateRequest' } } },
        },
        responses: {
          200: {
            description: 'Project updated',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Project' } } },
          },
          400: errorResponse('Validation error'),
          401: errorResponse('Missing or invalid access token'),
          403: errorResponse('Not the owner and not an admin'),
          404: errorResponse('Project not found'),
        },
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project (owner or admin only) — cascades to that project\'s tasks',
        security: [{ bearerAuth: [] }],
        responses: {
          204: { description: 'Project (and its tasks) deleted' },
          401: errorResponse('Missing or invalid access token'),
          403: errorResponse('Not the owner and not an admin'),
          404: errorResponse('Project not found'),
        },
      },
    },
    '/ai/chat': {
      post: {
        tags: ['Ai'],
        summary: 'Send a message to the AI task/project assistant',
        description:
          'The assistant can search, create, and update the tasks/projects the caller has access to (own only ' +
          'for USER, any for ADMIN) using the same server-side ownership rules as the REST endpoints. Deleting a ' +
          'task is never performed directly by the assistant — a returned pendingDelete must be confirmed by the ' +
          'client via the existing DELETE /tasks/{id} endpoint.',
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/AiChatRequest' } } },
        },
        responses: {
          200: {
            description: 'Assistant reply',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/AiChatResponse' } } },
          },
          400: errorResponse('Validation error'),
          401: errorResponse('Missing or invalid access token'),
          502: errorResponse('The AI provider returned an error (e.g. rate limited, quota exceeded)'),
          503: errorResponse('AI features are not configured (missing OPENAI_API_KEY)'),
        },
      },
    },
  },
};

module.exports = openapiSpec;
