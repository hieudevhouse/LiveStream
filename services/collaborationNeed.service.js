const CollaborationNeed = require('../models/CollaborationNeed');

const getByBusinessOwner = async (businessOwnerId) => {
  return CollaborationNeed.find({ businessOwnerId }).populate('productServiceId');
};

const getById = async (id) => {
  const collaborationNeed = await CollaborationNeed.findById(id).populate('productServiceId');
  if (!collaborationNeed) {
    const err = new Error('Collaboration need not found');
    err.status = 404;
    throw err;
  }
  return collaborationNeed;
};
const upsertCollaborationNeed = async (data) => {
  const { businessOwnerId, productServiceId, needs } = data;

  return await CollaborationNeed.findOneAndUpdate(
    {
      businessOwnerId,
      productServiceId
    },
    {
      needs,
      updatedAt: new Date()
    },
    {
      new: true,      // trả về document mới
      upsert: true    // nếu chưa có thì tạo mới
    }
  );
};

module.exports = { getByBusinessOwner, getById, upsertCollaborationNeed};
