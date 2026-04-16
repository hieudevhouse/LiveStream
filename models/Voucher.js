const mongoose = require('mongoose');

const voucherSchema = new mongoose.Schema({
  code: {
    type: String,
    required: [true, 'Mã voucher là bắt buộc'],
    unique: true,
    uppercase: true,
    trim: true
  },

  name: {
    type: String,
    required: [true, 'Tên voucher là bắt buộc'],
    trim: true
  },

  description: String,

  discountType: {
    type: String,
    enum: ['percentage', 'fixed'],
    required: true
  },

  discountValue: {
    type: Number,
    required: true,
    min: 0
  },

  minimumOrder: {
    type: Number,
    default: 0,
    min: 0
  },

  maximumDiscount: Number,

  usageLimit: {
    type: Number,
    min: 1
  },

  usageCount: {
    type: Number,
    default: 0,
    min: 0
  },

  validFrom: {
    type: Date,
    default: Date.now
  },

  validUntil: Date,

  isActive: {
    type: Boolean,
    default: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Method to calculate discount
voucherSchema.methods.calculateDiscount = function(orderTotal) {
  let discount = 0;

  if (this.discountType === 'percentage') {
    discount = (orderTotal * this.discountValue) / 100;
  } else {
    discount = this.discountValue;
  }

  // Apply maximum discount limit if set
  if (this.maximumDiscount && discount > this.maximumDiscount) {
    discount = this.maximumDiscount;
  }

  // Ensure discount doesn't exceed order total
  return Math.min(discount, orderTotal);
};

module.exports = mongoose.model('Voucher', voucherSchema);