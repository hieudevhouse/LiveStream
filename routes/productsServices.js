const express = require('express');
const multer = require('multer');
const path = require('path');
const {
  getByBusinessOwner,
  getById,
  create,
  update
} = require('../controllers/productServiceController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/products-services/'),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only images (JPG, PNG) and PDF files are allowed'));
  }
});

router.get('/business/:businessOwnerId', getByBusinessOwner);
router.get('/:id', getById);
router.post(
  '/',
  upload.fields([
    { name: 'descriptionImages', maxCount: 10 },
    { name: 'descriptionDocuments', maxCount: 10 },
    { name: 'intellectualPropertyCertificate', maxCount: 1 },
    { name: 'operatingLicense', maxCount: 1 },
    { name: 'certificationFiles', maxCount: 10 }
  ]),
  create
);
router.put(
  '/:id',
  upload.fields([
    { name: 'descriptionImages', maxCount: 10 },
    { name: 'descriptionDocuments', maxCount: 10 },
    { name: 'intellectualPropertyCertificate', maxCount: 1 },
    { name: 'operatingLicense', maxCount: 1 },
    { name: 'certificationFiles', maxCount: 10 }
  ]),
  update
);

module.exports = router;
