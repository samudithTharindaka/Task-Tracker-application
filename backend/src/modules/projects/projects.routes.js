const { Router } = require('express');
const projectsController = require('./projects.controller');
const { authenticate } = require('../../middleware/auth.middleware');

const router = Router();

router.use(authenticate);

router.get('/', projectsController.list);
router.get('/:id', projectsController.getById);
router.post('/', projectsController.create);
router.put('/:id', projectsController.update);
router.delete('/:id', projectsController.remove);

module.exports = router;
