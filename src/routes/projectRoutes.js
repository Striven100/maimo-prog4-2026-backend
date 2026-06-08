const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { obtenerProyectos, crearProyecto } = require('../controllers/projectController');

router.use(authMiddleware);
router.get('/', obtenerProyectos);
router.post('/', crearProyecto);

module.exports = router;
