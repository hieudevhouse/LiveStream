const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');

// Public routes - xác minh voucher và lấy danh sách
router.post('/validate', voucherController.validateVoucher);
router.get('/active', voucherController.getActiveVouchers);

// Admin routes (would need admin middleware in production)
// router.post('/', voucherController.createVoucher);
// router.get('/admin/all', voucherController.getAllVouchers);
// router.put('/:voucherId', voucherController.updateVoucher);
// router.delete('/:voucherId', voucherController.deleteVoucher);
// router.put('/:voucherId/toggle', voucherController.toggleVoucherStatus);

module.exports = router;