const express = require('express');
const router = express.Router();
const Gift = require('../models/Gift');
const Order = require('../models/Order');

// Thêm quà (dành cho Admin test hoặc sử dụng)
router.post('/', async (req, res) => {
  try {
    const { codes, name, description, imageUrl, stock, price } = req.body;
    const gift = new Gift({ codes, name, description, imageUrl, stock, price });
    await gift.save();
    res.json({ success: true, data: gift });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Redeem Gift code khach hang
router.post('/redeem', async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: 'Vui lòng nhập mã quà tặng' });

    const upperCode = code.toUpperCase();
    const gift = await Gift.findOne({ codes: upperCode });

    if (!gift) {
      return res.status(404).json({ success: false, message: 'Mã quà tặng không hợp lệ hoặc không tồn tại' });
    }

    if (gift.stock <= 0) {
      return res.status(400).json({ success: false, message: 'Rất tiếc, quà tặng này đã hết' });
    }

    res.json({ success: true, data: gift, code: upperCode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Lỗi server' });
  }
});

module.exports = router;
