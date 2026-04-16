const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: [true, 'Tên khách hàng là bắt buộc'],
    trim: true
  },

  customerEmail: {
    type: String,
    required: [true, 'Email là bắt buộc'],
    trim: true,
    lowercase: true,
    match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Email không hợp lệ']
  },

  customerPhone: {
    type: String,
    required: [true, 'Số điện thoại là bắt buộc'],
    trim: true
  },

  address: {
    type: String,
    required: [true, 'Địa chỉ là bắt buộc'],
    trim: true
  },

  ward: String,

  district: {
    type: String,
    required: [true, 'Quận/Huyện là bắt buộc'],
    trim: true
  },

  city: {
    type: String,
    required: [true, 'Tỉnh/Thành phố là bắt buộc'],
    trim: true
  },

  postalCode: String,

  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ProductService',
    required: true
  },

  businessOwner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessOwner',
    required: true
  },

  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },

  price: {
    type: Number,
    required: true,
    min: 0
  },

  totalPrice: {
    type: Number,
    required: true,
    min: 0
  },

  notes: String,

  status: {
    type: String,
    enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending'
  },

  voucher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Voucher'
  },

  voucherCode: String,

  discount: {
    type: Number,
    default: 0,
    min: 0
  },

  finalPrice: {
    type: Number,
    required: true,
    min: 0
  },

  orderNumber: {
    type: String,
    unique: true,
    sparse: true
  },

  paymentMethod: {
    type: String,
    enum: ['cod', 'bank_transfer', 'credit_card', 'e_wallet'],
    default: 'cod'
  },

  trackingNumber: String,

  shippingFee: {
    type: Number,
    default: 0,
    min: 0
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  },

  deliveredAt: Date,

  cancelledAt: Date,

  cancelReason: String
});

// Generate unique order number before saving
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    this.orderNumber = `ORD-${timestamp}-${random}`;
  }
  this.updatedAt = Date.now();
  next();
});

// Index for efficient queries
orderSchema.index({ customerEmail: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ businessOwner: 1 });

module.exports = mongoose.model('Order', orderSchema);