const businessOwnerService = require('../services/businessOwner.service');

const getByUserId = async (req, res) => {
  try {
    const businessOwner = await businessOwnerService.getByUserId(req.params.userId);
    res.json(businessOwner);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const upsert = async (req, res) => {
  try {
    const businessOwner = await businessOwnerService.upsert(req.body);
    res.json({ success: true, businessOwnerId: businessOwner._id, businessOwner });
  } catch (error) {
    console.error('Lỗi tạo/cập nhật BusinessOwner:', error);
    res.status(error.status || 500).json({ success: false, message: error.message || 'Lỗi server khi lưu BusinessOwner' });
  }
};

const checkTax = async (req, res) => {
  try {
    const result = await businessOwnerService.checkTax(req.body.taxCode);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const checkEmail = async (req, res) => {
  try {
    const result = await businessOwnerService.checkEmail(req.body.email);
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = { getByUserId, upsert, checkTax, checkEmail };

