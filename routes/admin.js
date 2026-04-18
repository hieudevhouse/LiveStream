const express = require('express');
const router = express.Router();
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const ProductService = require('../models/ProductService');
const Voucher = require('../models/Voucher');
const Order = require('../models/Order');
const BusinessOwner = require('../models/BusinessOwner');
const Gift = require('../models/Gift');
const multer = require('multer');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const { authAdmin, onlyAdmin } = require('../middlewares/auth');

// Cloudinary config
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'expo-gifts',
        allowed_formats: ['jpg', 'png', 'jpeg', 'webp'],
        public_id: (req, file) => 'gift-' + Date.now()
    }
});
const upload = multer({ storage });

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
        const user = await User.findOne({ email, role: { $in: ['admin', 'operator'] } });
        
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

// GET /admin/api/dashboard-stats
router.get('/api/dashboard-stats', authAdmin, async (req, res) => {
    try {
        const productCount = await ProductService.countDocuments();
        const voucherCount = await Voucher.countDocuments();
        const orderCount = await Order.countDocuments();
        
        // Pass to controller for chart data
        const stats = await require('../controllers/orderController').getDashboardStatsInternal();
        
        res.json({
            success: true,
            data: {
                productCount,
                voucherCount,
                orderCount,
                ...stats
            }
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Vouchers API ---
router.get('/api/vouchers', authAdmin, onlyAdmin, async (req, res) => {
    try {
        const vouchers = await Voucher.find().sort({ createdAt: -1 });
        res.json({ success: true, data: vouchers });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/api/vouchers', authAdmin, onlyAdmin, async (req, res) => {
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
router.get('/api/products', authAdmin, onlyAdmin, async (req, res) => {
    try {
        const products = await ProductService.find().populate('businessOwnerId', 'businessName').sort({ createdAt: -1 });
        res.json({ success: true, data: products });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/api/products', authAdmin, onlyAdmin, async (req, res) => {
    try {
        const newProduct = await ProductService.create(req.body);
        res.status(201).json({ success: true, data: newProduct });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
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
        const orders = await Order.find().populate('product').populate('gift').sort({ createdAt: -1 });
        res.json({ success: true, data: orders });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.get('/api/orders/:id', authAdmin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('product')
            .populate('gift')
            .populate('businessOwner', 'businessName email contactPhone name')
            .populate('voucher');
        if (!order) return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
        res.json({ success: true, data: order });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.put('/api/orders/:id/status', authAdmin, async (req, res) => {
    try {
        const { status } = req.body;
        const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

// --- Business Owners API for dropdowns ---
router.get('/api/business-owners', authAdmin, async (req, res) => {
    try {
        const owners = await BusinessOwner.find().select('businessName name email');
        res.json({ success: true, data: owners });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Upload API ---
router.post('/api/upload', authAdmin, upload.single('file'), (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ success: false, message: 'Không có file nào được tải lên' });
        // Với CloudinaryStorage, Cloudinary URL nằm ở req.file.path hoặc req.file.secure_url
        const filePath = req.file.path;
        res.json({ success: true, url: filePath });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// --- Gifts API ---
router.get('/api/gifts', authAdmin, onlyAdmin, async (req, res) => {
    try {
        const gifts = await Gift.find().sort({ createdAt: -1 });
        res.json({ success: true, data: gifts });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

router.post('/api/gifts', authAdmin, onlyAdmin, async (req, res) => {
    try {
        if (req.body.codes && typeof req.body.codes === 'string') {
            req.body.codes = req.body.codes.split(',').map(c => c.trim().toUpperCase());
        }
        const newGift = await Gift.create(req.body);
        res.status(201).json({ success: true, data: newGift });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.put('/api/gifts/:id', authAdmin, async (req, res) => {
    try {
        if (req.body.codes && typeof req.body.codes === 'string') {
            req.body.codes = req.body.codes.split(',').map(c => c.trim().toUpperCase());
        }
        const updated = await Gift.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.json({ success: true, data: updated });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

router.delete('/api/gifts/:id', authAdmin, async (req, res) => {
    try {
        await Gift.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Đã xóa quà tặng' });
    } catch (err) {
        res.status(400).json({ success: false, message: err.message });
    }
});

module.exports = router;
