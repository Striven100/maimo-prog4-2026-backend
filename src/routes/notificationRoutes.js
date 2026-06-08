const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { obtenerNotificaciones, crearNotificacion, marcarLeida } = require('../controllers/notificationController');

router.use(authMiddleware);
router.get('/', obtenerNotificaciones);
router.post('/', crearNotificacion);
router.patch('/:id/read', marcarLeida);

module.exports = router;
