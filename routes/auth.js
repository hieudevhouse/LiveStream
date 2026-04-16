const express = require('express');
const {
  register,
  login,
  registerAuto,
  checkEmailExists
} = require('../controllers/authController');
const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/register-auto', registerAuto);
router.get('/check-email', checkEmailExists);

module.exports = router;
