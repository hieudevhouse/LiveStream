const mongoose = require('mongoose');
const productServiceSchema = new mongoose.Schema({

  productId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },

  businessOwnerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'BusinessOwner',
    required: true,
    index: true
  },

  name: {
    type: String,
    required: [true, 'Tên sản phẩm/dịch vụ là bắt buộc'],
    trim: true
  },

  type: {
    type: String,
    enum: ['product', 'service'],
    required: [true, 'Loại hình (product/service) là bắt buộc']
  },

  businessField: {
    type: String,
    required: [true, 'Lĩnh vực kinh doanh là bắt buộc'],
    trim: true
  },

  description: {
    general: {
      type: String,
      trim: true
    },
    keywords: [{
      type: String,
      trim: true
    }],
    images: [{
      type: String  // đường dẫn file (sau này dùng multer/cloudinary)
    }],
    documents: [{
      type: String  // đường dẫn file
    }]
  },

  socialChannels: [{
    platform: {
      type: String,
      trim: true
    },
    url: {
      type: String,
      trim: true
    }
  }],

  // Product specific fields (chỉ dùng khi type === 'product')
  product: {
    gtinCode: {
      type: String,
      trim: true
    },
    intellectualProperty: {
      registrationStatus: String,
      type: {
        type: String,
        enum: ['trademark', 'industrial_design', 'invention', 'other']
      },
      certificate: String  // đường dẫn file chứng nhận
    },
    geographicalIndications: [{
      category: {
        type: String,
        enum: ['production_facility', 'raw_material_area', 'distribution_agent']
      },
      address: {
        type: String,
        trim: true
      }
    }]
  },

  // Service specific fields (chỉ dùng khi type === 'service')
  service: {
    form: {
      type: String,
      enum: ['online', 'offline', 'hybrid']
    },
    scope: String,
    operatingLicense: String  // đường dẫn file giấy phép
  },

  pricing: {
    baseCost: {
      type: Number,
      default: 0,
      min: 0
    },
    currency: {
      type: String,
      default: 'VND',
      trim: true
    },
    stock: {
      type: Number,
      default: 0,
      min: 0
    }
  },

  booking: {
    selectedChannel: String,
    bookings: [
      {
        slotCode: String,
        channel: String,
        timeRange: String,
        durationSeconds: Number,
        unitPrice: Number,
        quantity: Number
      }
    ],
    campaignGoal: String,
    budgetNote: String,
    videoNote: String,
    videoFileName: String,
    totalPrice: Number
  },

  certifications: [{
    name: {
      type: String,
      trim: true
    },
    certificate: String  // đường dẫn file chứng nhận
  }],

  vouchers: [{
    code: {
      type: String,
      trim: true
    },
    quantity: {
      type: Number,
      min: 0
    },
    startDate: {
      type: Date
    },
    expiryDate: {
      type: Date
    },
    value: {
      type: Number,
      min: 0
    }
  }],

  createdAt: {
    type: Date,
    default: Date.now
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});


// Hook pre-save: tự động gán productId = _id.toString()
productServiceSchema.pre('save', function (next) {
  this.updatedAt = new Date();

  // Nếu chưa có  → gán bằng _id (ObjectId dạng string)
  if (!this.productId && this._id) {
    this.productId = this._id.toString();
  }

  next();
});
// Tạo model
module.exports = mongoose.model('ProductService', productServiceSchema);