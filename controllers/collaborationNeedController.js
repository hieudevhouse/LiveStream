const collaborationNeedService = require('../services/collaborationNeed.service');

const getByBusinessOwner = async (req, res) => {
  try {
    const collaborationNeeds = await collaborationNeedService.getByBusinessOwner(req.params.businessOwnerId);
    res.json(collaborationNeeds);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const collaborationNeed = await collaborationNeedService.getById(req.params.id);
    res.json(collaborationNeed);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

// const create = async (req, res) => {
//   try {
//     const collaborationNeed = await collaborationNeedService.create(req.body);
//     // check duplicate collaborationNeed 
//     if (!collaborationNeed) {
//       return res.status(400).json({ message: 'Collaboration need already exists' });
//     }

//     res.status(201).json({ message: 'Collaboration need created successfully', collaborationNeed });
//   } catch (error) {
//     res.status(error.status || 500).json({ message: error.message });
//   }
// };

// const update = async (req, res) => {
//   try {
//     const collaborationNeed = await collaborationNeedService.update(req.params.id, req.body);
//     res.json({ message: 'Collaboration need updated successfully', collaborationNeed });
//   } catch (error) {
//     res.status(error.status || 500).json({ message: error.message });
//   }
// };
const createOrUpdate = async (req, res) => {
  try {
    const collaborationNeed = await collaborationNeedService.upsertCollaborationNeed(req.body);

    res.status(200).json({
      message: 'Saved successfully',
      collaborationNeed
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};
module.exports = { getByBusinessOwner, getById, createOrUpdate };
