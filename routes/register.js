const express = require('express');
const multer = require('multer');
const path = require('path');
const { renderRegister, submitRegistration } = require('../controllers/registrationController');

const router = express.Router();

const { storage } = require('../config/cloudinary');

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // Tang len 10MB cho Cloudinary
});


router.get(['/', '/register'], renderRegister);
router.post('/register/submit', upload.any(), submitRegistration);

module.exports = router;
