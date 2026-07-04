const { Router } = require('express');
const tasksController = require('./tasks.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { odataQuery } = require('../../middleware/odata-query.middleware');

const router = Router();

router.use(authenticate);

router.get('/', odataQuery, tasksController.list);
router.get('/:id', tasksController.getById);
router.post('/', tasksController.create);
router.put('/:id', tasksController.update);
router.delete('/:id', tasksController.remove);

module.exports = router;
