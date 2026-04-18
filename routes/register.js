const express = require('express');
const multer = require('multer');
const path = require('path');
const { renderRegister, submitRegistration } = require('../controllers/registrationController');

const router = express.Router();

const { storage } = require('../config/cloudinary');

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 200 * 1024 * 1024, // 200MB
    fields: 1000 // Tăng từ 100 lên 1000 để hỗ trợ add nhiều sản phẩm
  }
});


router.get(['/', '/register'], renderRegister);
router.post('/register/submit', upload.any(), submitRegistration);

module.exports = router;
