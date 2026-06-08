const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { buscarUsuarios, obtenerUsuario, actualizarUsuario, usuariosDisponibles, obtenerPreferencias, actualizarPreferencias } = require('../controllers/userController');

router.get('/search', authMiddleware, buscarUsuarios);
router.get('/available-friends/:userId', usuariosDisponibles);
router.get('/preferences/:userId', obtenerPreferencias);
router.put('/preferences/:userId', actualizarPreferencias);
router.get('/:id', obtenerUsuario);
router.put('/:id', authMiddleware, actualizarUsuario);

module.exports = router;
