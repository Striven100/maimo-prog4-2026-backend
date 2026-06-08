const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { obtenerProgreso, completarTarea } = require('../controllers/gamificationController');

router.use(authMiddleware);
router.get('/progress', obtenerProgreso);

module.exports = router;
