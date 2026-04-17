const mongoose = require('mongoose');

const businessOwnerSchema = new mongoose.Schema({
  userId: {
    type: String,
    ref: 'User',
    required: true,
    unique: true
  },
  ownershipType: {
    type: String,
    enum: ['individual', 'business', 'other'],
    required: true
  },
  // Business information
  businessName: String,
  taxCode: String,
  address: String,
  phone: String,
  email: String,
  legalRepresentative: {
    name: String,
    idNumber: String,
    position: String
  },
  contactRepresentative: {
    name: String,
    phone: String,
    email: String
  },
  website: String,
  logo: String, // Logo file path
  businessVerification: {
    leiCode: String,
    businessRegistrationScan: String // File path
  },
  // Individual information
  individualName: String,
  individualIdNumber: String,
  individualTaxCode: String,
  individualAddress: String,
  individualPhone: String,
  individualEmail: String,
  // Other ownership type
  otherDescription: String,
  otherRepresentative: {
    name: String,
    idNumber: String,
    address: String,
    phone: String,
    email: String
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

businessOwnerSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});
businessOwnerSchema.index({ taxCode: 1 });
businessOwnerSchema.index({ email: 1 });
businessOwnerSchema.index({ individualEmail: 1 });
businessOwnerSchema.index({ 'contactRepresentative.email': 1 });
module.exports = mongoose.model('BusinessOwner', businessOwnerSchema);
