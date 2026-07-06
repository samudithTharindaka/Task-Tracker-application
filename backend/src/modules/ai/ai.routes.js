const { Router } = require('express');
const aiController = require('./ai.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.post('/chat', aiController.chat);

module.exports = router;
