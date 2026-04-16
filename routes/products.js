const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// View routes
router.get('/view', (req, res) => {
  res.render('products');
});

// API routes
router.get('/', productController.getProducts);
router.get('/featured', productController.getFeaturedProducts);
router.get('/search', productController.searchProducts);
router.get('/brands', productController.getAllBrands);
router.get('/:id', productController.getProduct);
router.get('/brand/:brandId', productController.getProductsByBrand);

module.exports = router;