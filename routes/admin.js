const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ProductService = require('../models/ProductService');
const Voucher = require('../models/Voucher');
const Order = require('../models/Order');
const { authAdmin } = require('../middlewares/auth');

// === WEB ROUTES ===
router.get('/login', (req, res) => {
    res.render('admin/login');
});

router.get('/', (req, res) => {
    // We will render dashboard; the dashboard JS will check localStorage for token
    res.render('admin/dashboard');
});

// === API ROUTES ===
// POST /admin/api/login
router.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email, role: 'admin' });
        
        if (!user) {
            return res.status(401).json({ success: false, message: 'Sai email hoặc không có quyền Admin' });
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Mật khẩu không đúng' });
        }
        
        const token = jwt.sign(
            { id: user._id, role: user.role, email: user.email }, 
            process.env.JWT_SECRET || 'fallback_secret_key', 
            { expiresIn: '1d' }
        );
        
        res.json({ success: true, token, message: 'Đăng nhập thành công' });
    } catch (err) {
        console.error("Admin Login Error:", err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// GET /admin/api/stats
router.get('/api/stats', authAdmin, async (req, res) => {
    try {
        const productCount = await ProductService.countDocuments();
        const voucherCount = await Voucher.countDocuments();
        const orderCount = await Order.countDocuments();
        res.json({ success: true, data: { productCount, voucherCount, orderCount } });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Vouchers API ---
router.get('/api/vouchers', authAdmin, async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 });
        res.json({ success: true, data: vouchers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/api/vouchers', authAdmin, async (req, res) => {
    try {
        const newVoucher = await Voucher.create(req.body);
        res.status(201).json({ success: true, data: newVoucher });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.put('/api/vouchers/:id', authAdmin, async (req, res) => {
    try {
        const updated = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.delete('/api/vouchers/:id', authAdmin, async (req, res) => {
    try {
        await Voucher.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Đã xóa voucher' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// --- Products API ---
router.get('/api/products', authAdmin, async (req, res) => {
    try {
        const products = await ProductService.find().populate('businessOwnerId', 'businessName').sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/api/products/:id', authAdmin, async (req, res) => {
    try {
        const updated = await ProductService.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.delete('/api/products/:id', authAdmin, async (req, res) => {
    try {
        await ProductService.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Đã xóa sản phẩm' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// --- Orders API ---
router.get('/api/orders', authAdmin, async (req, res) => {
    try {
        const orders = await Order.find().populate('items.productId').sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
