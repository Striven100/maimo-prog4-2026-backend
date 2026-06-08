const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { obtenerAmigos, buscarUsuarios, enviarSolicitud, obtenerSolicitudesPendientes, responderSolicitud } = require('../controllers/friendController');

router.use(authMiddleware);
router.get('/', obtenerAmigos);
router.get('/search', buscarUsuarios);
router.get('/solicitudes', obtenerSolicitudesPendientes);
router.post('/solicitar', enviarSolicitud);
router.put('/solicitud/:id', responderSolicitud);

module.exports = router;
