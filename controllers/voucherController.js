const Voucher = require('../models/Voucher');
const ProductService = require('../models/ProductService');
const Order = require('../models/Order');

class VoucherController {
  // Validate voucher code
  async validateVoucher(req, res) {
    try {
      const { code, orderTotal, productId } = req.body;
      const normalizedCode = code.toUpperCase();

      // 1. Check Global Vouchers
      let voucher = await Voucher.findOne({
        code: normalizedCode,
        isActive: true
      });

      // 2. If not found and productId is provided, check Product Specific Vouchers
      let source = 'global';
      if (!voucher && productId) {
        const product = await ProductService.findById(productId);
        if (product && product.vouchers && product.vouchers.length > 0) {
          const productVoucher = product.vouchers.find(v => v.code === normalizedCode);
          if (productVoucher) {
            voucher = {
              code: productVoucher.code,
              name: 'Khuyến mãi sản phẩm',
              discountType: 'fixed', // Default for product-embedded vouchers
              discountValue: productVoucher.value,
              usageLimit: productVoucher.quantity,
              usageCount: 0, // We'll need a better way to track this if it gets complex
              validFrom: productVoucher.startDate,
              validUntil: productVoucher.expiryDate,
              minimumOrder: 0
            };
            source = 'product';
          }
        }
      }

      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Mã voucher không hợp lệ'
        });
      }

      // Check if user already used this specific voucher code
      if (req.body.customerEmail) {
        const existingOrder = await Order.findOne({
          customerEmail: req.body.customerEmail.toLowerCase(),
          voucherCode: normalizedCode,
          status: { $ne: 'cancelled' }
        });
        if (existingOrder) {
          return res.status(400).json({
            success: false,
            message: 'Bạn đã sử dụng mã voucher này rồi'
          });
        }
      }

      // Check if voucher is still valid (Start Date)
      const now = new Date();
      const validFrom = voucher.validFrom || voucher.startDate;
      if (validFrom && now < new Date(validFrom)) {
        return res.status(400).json({
          success: false,
          message: 'Voucher chưa đến thời gian áp dụng'
        });
      }

      // Check if voucher is still valid (Expiry Date)
      if (voucher.validUntil && now > new Date(voucher.validUntil)) {
        return res.status(400).json({
          success: false,
          message: 'Voucher đã hết hạn'
        });
      }

      // Check Usage Limit
      if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
        return res.status(400).json({
          success: false,
          message: 'Voucher đã hết số lần sử dụng'
        });
      }

      // Check Minimum Order
      if (orderTotal < (voucher.minimumOrder || 0)) {
        return res.status(400).json({
          success: false,
          message: `Tổng tiền tối thiểu phải từ ${voucher.minimumOrder.toLocaleString()} VND`
        });
      }

      // Calculate discount
      let discount = 0;
      if (voucher.discountType === 'percentage') {
        discount = (orderTotal * voucher.discountValue) / 100;
      } else {
        discount = voucher.discountValue;
      }

      if (voucher.maximumDiscount) {
        discount = Math.min(discount, voucher.maximumDiscount);
      }

      res.json({
        success: true,
        data: {
          code: voucher.code,
          name: voucher.name,
          discountType: voucher.discountType || 'fixed',
          discountValue: voucher.discountValue,
          discount: Math.round(discount),
          source
        }
      });
    } catch (error) {
      console.error('Error validating voucher:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xác minh voucher'
      });
    }
  }

  // Get active vouchers
  async getActiveVouchers(req, res) {
    try {
      const { limit = 10 } = req.query;

      const vouchers = await Voucher.find({
        isActive: true,
        validUntil: { $gte: new Date() }
      })
        .select('code name description discountType discountValue minimumOrder validUntil')
        .sort({ createdAt: -1 })
        .limit(parseInt(limit));

      res.json({
        success: true,
        data: vouchers
      });
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách voucher'
      });
    }
  }

  // Admin: Create new voucher
  async createVoucher(req, res) {
    try {
      const voucherData = req.body;
      voucherData.code = voucherData.code.toUpperCase();

      const voucher = new Voucher(voucherData);
      await voucher.save();

      res.status(201).json({
        success: true,
        message: 'Tạo voucher thành công',
        data: voucher
      });
    } catch (error) {
      console.error('Error creating voucher:', error);
      if (error.code === 11000) {
        res.status(400).json({
          success: false,
          message: 'Mã voucher đã tồn tại'
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Lỗi khi tạo voucher'
        });
      }
    }
  }

  // Admin: Get all vouchers
  async getAllVouchers(req, res) {
    try {
      const { page = 1, limit = 20, status } = req.query;
      const query = {};

      if (status === 'active') {
        query.isActive = true;
        query.validUntil = { $gte: new Date() };
      } else if (status === 'inactive') {
        query.isActive = false;
      }

      const vouchers = await Voucher.find(query)
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Voucher.countDocuments(query);

      res.json({
        success: true,
        data: {
          vouchers,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      console.error('Error fetching vouchers:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách voucher'
      });
    }
  }

  // Admin: Update voucher
  async updateVoucher(req, res) {
    try {
      const { voucherId } = req.params;
      const updateData = req.body;

      if (updateData.code) {
        updateData.code = updateData.code.toUpperCase();
      }

      const voucher = await Voucher.findByIdAndUpdate(
        voucherId,
        updateData,
        { new: true, runValidators: true }
      );

      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher không tìm thấy'
        });
      }

      res.json({
        success: true,
        message: 'Cập nhật voucher thành công',
        data: voucher
      });
    } catch (error) {
      console.error('Error updating voucher:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật voucher'
      });
    }
  }

  // Admin: Delete voucher
  async deleteVoucher(req, res) {
    try {
      const { voucherId } = req.params;
      const voucher = await Voucher.findByIdAndDelete(voucherId);

      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher không tìm thấy'
        });
      }

      res.json({
        success: true,
        message: 'Xóa voucher thành công'
      });
    } catch (error) {
      console.error('Error deleting voucher:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi xóa voucher'
      });
    }
  }

  // Admin: Toggle voucher active status
  async toggleVoucherStatus(req, res) {
    try {
      const { voucherId } = req.params;
      const voucher = await Voucher.findById(voucherId);

      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Voucher không tìm thấy'
        });
      }

      voucher.isActive = !voucher.isActive;
      await voucher.save();

      res.json({
        success: true,
        message: `Voucher ${voucher.isActive ? 'đã kích hoạt' : 'đã vô hiệu hóa'}`,
        data: voucher
      });
    } catch (error) {
      console.error('Error toggling voucher status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái voucher'
      });
    }
  }
}

module.exports = new VoucherController();

module.exports = new VoucherController();