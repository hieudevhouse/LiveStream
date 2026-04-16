const BusinessOwner = require('../models/BusinessOwner');
const ProductService = require('../models/ProductService');

const getByUserId = async (userId) => {
  const businessOwner = await BusinessOwner.findOne({ userId });
  if (!businessOwner) {
    const err = new Error('Business owner not found');
    err.status = 404;
    throw err;
  }
  return businessOwner;
};

const upsert = async (data) => {
  if (data.taxCode) {
    const existingTaxCode = await BusinessOwner.findOne({
      taxCode: data.taxCode,
      userId: { $ne: data.userId }
    });

    if (existingTaxCode) {
      const err = new Error('Mã số thuế đã tồn tại cho một chủ doanh nghiệp khác');
      err.status = 400;
      throw err;
    }
  }

  const businessOwner = await BusinessOwner.findOneAndUpdate(
    { userId: data.userId },
    {
      $set: data,
      $setOnInsert: { createdAt: new Date() }
    },
    {
      new: true,
      upsert: true
    }
  );

  return businessOwner;
};

const checkTax = async (taxCode) => {
  if (!taxCode) {
    const err = new Error('Thiếu mã số thuế');
    err.status = 400;
    throw err;
  }

  const businessOwner = await BusinessOwner.findOne({ taxCode });
  if (!businessOwner) {
    return { available: true, message: 'Có thể sử dụng' };
  }

  return { available: false, message: 'Mã số thuế đã tồn tại' };
};

const checkEmail = async (email) => {
  if (!email) {
    const err = new Error('Thiếu email');
    err.status = 400;
    throw err;
  }

  const lowerEmail = email.toLowerCase();
  const businessOwner = await BusinessOwner.findOne({
    $or: [
      { email: lowerEmail },
      { individualEmail: lowerEmail },
      { 'contactRepresentative.email': lowerEmail }
    ]
  });

  if (!businessOwner) {
    return { available: true, message: 'Có thể sử dụng' };
  }

  return { available: false, message: 'Email đã được sử dụng' };
};

module.exports = { getByUserId, upsert, checkTax, checkEmail };
