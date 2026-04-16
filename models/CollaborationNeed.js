const mongoose = require('mongoose');

const collaborationNeedSchema = new mongoose.Schema({
  businessOwnerId: {
    type: String,
    ref: 'BusinessOwner',
    required: true
  },
  productServiceId: {
    type: String,
    ref: 'ProductService',
    required: true
  },
  needs: [{
    type: {
      type: String,
      enum: [
        'product_service_promotion',
        'market_development',
        'investment_connection',
        'policy_advocacy'
      ],
      required: true
    },
    description: String
  }],
  status: {
    type: String,
    enum: ['pending', 'in_review', 'approved', 'rejected'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

collaborationNeedSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
collaborationNeedSchema.index(
  { businessOwnerId: 1, productServiceId: 1 },
  { unique: true }
);
module.exports = mongoose.model('CollaborationNeed', collaborationNeedSchema);
