const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const authRoutes = require('./modules/auth/auth.routes');
const tasksRoutes = require('./modules/tasks/tasks.routes');
const projectsRoutes = require('./modules/projects/projects.routes');
const aiRoutes = require('./modules/ai/ai.routes');
const { notFoundHandler, errorHandler } = require('./middleware/error.middleware');
const openapiSpec = require('./docs/openapi');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.get('/api-docs.json', (req, res) => res.status(200).json(openapiSpec));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

app.use('/api/auth', authRoutes);
app.use('/api/tasks', tasksRoutes);
app.use('/api/projects', projectsRoutes);
app.use('/api/ai', aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
