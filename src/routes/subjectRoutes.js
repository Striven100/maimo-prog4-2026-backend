const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { obtenerMaterias, obtenerMateria, crearMateria, actualizarMateria, eliminarMateria, obtenerCombinables, combinar, agregarNota, obtenerNotas } = require('../controllers/subjectController');

router.use(authMiddleware);
router.get('/', obtenerMaterias);
router.get('/combinable', obtenerCombinables);
router.post('/combine', combinar);
router.post('/:id/notes', agregarNota);
router.get('/:id/notes', obtenerNotas);
router.get('/:id', obtenerMateria);
router.post('/', crearMateria);
router.put('/:id', actualizarMateria);
router.delete('/:id', eliminarMateria);

module.exports = router;
