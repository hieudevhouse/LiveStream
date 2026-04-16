const express = require('express');
const multer = require('multer');
const path = require('path');
const { renderRegister, submitRegistration } = require('../controllers/registrationController');

const router = express.Router();

// Cấu hình multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/products-services'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }
});

router.get(['/', '/register'], renderRegister);
router.post('/register/submit', upload.any(), submitRegistration);

module.exports = router;
