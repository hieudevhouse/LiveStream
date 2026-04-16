const express = require('express');
const {
  getByBusinessOwner,
  getById,
  createOrUpdate,
  // update
} = require('../controllers/collaborationNeedController');

const router = express.Router();

router.get('/business-owner/:businessOwnerId', getByBusinessOwner);
router.get('/:id', getById);
router.post('/', createOrUpdate);
// router.put('/:id', update);

module.exports = router;
