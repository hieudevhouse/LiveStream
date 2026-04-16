const express = require('express');
const { getByUserId,
  upsert,
  checkTax,
  checkEmail
} = require('../controllers/businessOwnerController');

const router = express.Router();

router.post('/check-tax', checkTax);
router.post('/check-email', checkEmail);
router.post('/upsert', upsert);
router.get('/:userId', getByUserId);

module.exports = router;