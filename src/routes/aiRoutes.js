const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { sugerir } = require('../controllers/aiController');

router.post('/suggest', authMiddleware, sugerir);

module.exports = router;
