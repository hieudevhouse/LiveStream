const express = require('express');
const { registerAuto } = require('../controllers/authController');
const router = express.Router();

router.post('/register-auto', registerAuto);

module.exports = router;