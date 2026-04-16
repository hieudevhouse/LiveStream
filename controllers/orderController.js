const Order = require('../models/Order');
const ProductService = require('../models/ProductService');
const Voucher = require('../models/Voucher');

class OrderController {
  // Create new order - khách hàng truy cập trang sản phẩm và đặt hàng
  async createOrder(req, res) {
    try {
      const {
        productId,
        quantity,
        customerName,
        customerEmail,
        customerPhone,
        address,
        ward,
        district,
        city,
        postalCode,
        paymentMethod = 'cod',
        notes,
        voucherCode
      } = req.body;

      // Validate required fields
      if (!customerName || !customerEmail || !customerPhone || !address || !district || !city) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng điền đầy đủ thông tin bắt buộc'
        });
      }

      // Get product
      const product = await ProductService.findById(productId)
        .populate('businessOwnerId');

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Sản phẩm/dịch vụ không tìm thấy'
        });
      }

      // Calculate prices
      const quantityNumber = parseInt(quantity, 10) || 1;
      const price = product.pricing?.baseCost || product.booking?.totalPrice || 0;
      const totalPrice = price * quantityNumber;

      // Apply voucher if provided
      let discount = 0;
      let voucherId = null;
      let finalPrice = totalPrice;

      if (voucherCode) {
        const voucher = await Voucher.findOne({
          code: voucherCode.toUpperCase(),
          isActive: true
        });

        if (!voucher) {
          return res.status(400).json({
            success: false,
            message: 'Mã voucher không hợp lệ hoặc đã bị vô hiệu hóa'
          });
        }

        if (voucher.validFrom && new Date() < voucher.validFrom) {
          return res.status(400).json({
            success: false,
            message: 'Voucher chưa có hiệu lực'
          });
        }

        if (voucher.validUntil && new Date() > voucher.validUntil) {
          return res.status(400).json({
            success: false,
            message: 'Voucher đã hết hạn'
          });
        }

        if (voucher.usageLimit && voucher.usageCount >= voucher.usageLimit) {
          return res.status(400).json({
            success: false,
            message: 'Voucher đã hết số lần sử dụng'
          });
        }

        if (voucher.applicableProduct && voucher.applicableProduct.toString() !== productId.toString()) {
          return res.status(400).json({
            success: false,
            message: 'Voucher này không áp dụng cho sản phẩm bạn đang đặt'
          });
        }

        if (totalPrice < voucher.minimumOrder) {
          return res.status(400).json({
            success: false,
            message: `Tổng tiền tối thiểu phải từ ${voucher.minimumOrder.toLocaleString()} VND`
          });
        }

        discount = voucher.calculateDiscount(totalPrice);
        finalPrice = Math.max(0, totalPrice - discount);
        voucherId = voucher._id;
        voucher.usageCount = (voucher.usageCount || 0) + 1;
        await voucher.save();
      }

      // Create order
      const order = new Order({
        customerName,
        customerEmail,
        customerPhone,
        address,
        ward,
        district,
        city,
        postalCode,
        product: productId,
        businessOwner: product.businessOwnerId._id,
        quantity: quantityNumber,
        price,
        totalPrice,
        discount,
        finalPrice,
        paymentMethod,
        notes,
        voucher: voucherId,
        voucherCode: voucherCode?.toUpperCase()
      });

      await order.save();

      // Populate for response
      await order.populate('product', 'name businessField');
      await order.populate('businessOwner', 'name email contactPhone');
      await order.populate('voucher', 'code name');

      res.status(201).json({
        success: true,
        message: 'Đặt hàng thành công',
        data: order
      });
    } catch (error) {
      console.error('Error creating order:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tạo đơn hàng'
      });
    }
  }

  // Get order by ID
  async getOrder(req, res) {
    try {
      const { orderId } = req.params;

      const order = await Order.findById(orderId)
        .populate('product', 'name businessField description.images')
        .populate('businessOwner', 'name email contactPhone website')
        .populate('voucher', 'code name discountType discountValue');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Đơn hàng không tìm thấy'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error fetching order:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy đơn hàng'
      });
    }
  }

  // Get order by order number (for tracking)
  async trackOrder(req, res) {
    try {
      const { orderNumber } = req.params;

      const order = await Order.findOne({ orderNumber })
        .populate('product', 'name businessField description.images')
        .populate('businessOwner', 'name email contactPhone')
        .select('-__v');

      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Đơn hàng không tìm thấy'
        });
      }

      res.json({
        success: true,
        data: order
      });
    } catch (error) {
      console.error('Error tracking order:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi theo dõi đơn hàng'
      });
    }
  }

  // Get orders by customer email
  async getOrdersByEmail(req, res) {
    try {
      const { email } = req.params;
      const { page = 1, limit = 10, status } = req.query;

      const query = { customerEmail: email.toLowerCase() };
      if (status) {
        query.status = status;
      }

      const orders = await Order.find(query)
        .populate('product', 'name businessField')
        .populate('businessOwner', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Order.countDocuments(query);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalOrders: total
          }
        }
      });
    } catch (error) {
      console.error('Error fetching orders:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đơn hàng'
      });
    }
  }

  // Admin: Get all orders
  async getAllOrders(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        status,
        startDate,
        endDate,
        businessOwnerId,
        search
      } = req.query;

      const query = {};

      if (status) query.status = status;
      if (businessOwnerId) query.businessOwner = businessOwnerId;

      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      if (search) {
        query.$or = [
          { orderNumber: new RegExp(search, 'i') },
          { customerName: new RegExp(search, 'i') },
          { customerEmail: new RegExp(search, 'i') },
          { customerPhone: new RegExp(search, 'i') }
        ];
      }

      const orders = await Order.find(query)
        .populate('product', 'name')
        .populate('businessOwner', 'name')
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Order.countDocuments(query);

      res.json({
        success: true,
        data: {
          orders,
          pagination: {
            currentPage: parseInt(page),
            totalPages: Math.ceil(total / limit),
            totalOrders: total
          }
        }
      });
    } catch (error) {
      console.error('Error fetching all orders:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi lấy danh sách đơn hàng'
      });
    }
  }

  // Admin: Update order status
  async updateOrderStatus(req, res) {
    try {
      const { orderId } = req.params;
      const { status, trackingNumber } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Đơn hàng không tìm thấy'
        });
      }

      order.status = status;
      if (trackingNumber) order.trackingNumber = trackingNumber;
      if (status === 'delivered') {
        order.deliveredAt = new Date();
      }
      if (status === 'cancelled') {
        order.cancelledAt = new Date();
      }

      await order.save();

      res.json({
        success: true,
        message: 'Cập nhật trạng thái đơn hàng thành công',
        data: order
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi cập nhật trạng thái'
      });
    }
  }

  // Cancel order
  async cancelOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { reason } = req.body;

      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Đơn hàng không tìm thấy'
        });
      }

      if (!['pending', 'confirmed'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Không thể hủy đơn hàng ở trạng thái này'
        });
      }

      order.status = 'cancelled';
      order.cancelledAt = new Date();
      order.cancelReason = reason;
      await order.save();

      res.json({
        success: true,
        message: 'Đơn hàng đã được hủy',
        data: order
      });
    } catch (error) {
      console.error('Error cancelling order:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi khi hủy đơn hàng'
      });
    }
  }
}

module.exports = new OrderController();

module.exports = new OrderController();