const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { obtenerTareas, crearTarea, actualizarTarea, cambiarEstado, eliminarTarea } = require('../controllers/taskController');

router.use(authMiddleware);
router.get('/', obtenerTareas);
router.post('/', crearTarea);
router.patch('/:id/status', cambiarEstado);
router.put('/:id', actualizarTarea);
router.delete('/:id', eliminarTarea);

module.exports = router;
