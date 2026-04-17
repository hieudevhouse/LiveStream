const mongoose = require('mongoose');

const giftSchema = new mongoose.Schema({
  codes: [{
    type: String,
    trim: true,
    uppercase: true
  }],
  name: {
    type: String,
    required: true
  },
  description: String,
  imageUrl: String,
  stock: {
    type: Number,
    default: 0
  },
  price: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Gift', giftSchema);
