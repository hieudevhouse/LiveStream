const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

// Public routes - khách hàng có thể đặt hàng mà không cần đăng nhập
router.post('/', orderController.createOrder);
router.get('/:orderId', orderController.getOrder);
router.get('/track/:orderNumber', orderController.trackOrder);
router.get('/email/:email', orderController.getOrdersByEmail);
router.get('/phone/:phone', orderController.getOrdersByPhone);
router.put('/:orderId/cancel', orderController.cancelOrder);

// Admin routes (would need admin middleware in production)
// router.get('/admin/all', orderController.getAllOrders);
// router.put('/admin/:orderId/status', orderController.updateOrderStatus);

module.exports = router;