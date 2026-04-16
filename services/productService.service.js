const ProductService = require('../models/ProductService');
const { indexProductService } = require('./vector.service');

const getByBusinessOwner = async (businessOwnerId) => {
  return ProductService.find({ businessOwnerId });
};

const getById = async (id) => {
  const productService = await ProductService.findById(id);
  if (!productService) {
    const err = new Error('Product/Service not found');
    err.status = 404;
    throw err;
  }
  return productService;
};

// const create = async (productServiceData) => {
//   const existing = await ProductService.findOne({
//     businessOwnerId: productServiceData.businessOwnerId
//   });

//   if (existing) {
//     return { isDuplicate: true, productService: existing };
//   }

//   const productService = new ProductService(productServiceData);
//   await productService.save();
//   return { isDuplicate: false, productService };
// };
const create = async (productServiceData) => {
  const existing = await ProductService.findOne({
    businessOwnerId: productServiceData.businessOwnerId,
    name: productServiceData.name
  });

  if (existing) {
    return { isDuplicate: true, productService: existing };
  }

  const productService = new ProductService(productServiceData);
  await productService.save();
  
  // Index for smart search
  try {
    await indexProductService(productService);
  } catch (error) {
    console.warn(`⚠️ Background indexing failed for ${productService._id}:`, error.message);
  }
  
  return { isDuplicate: false, productService };
};
const update = async (id, updateData) => {
  const productService = await ProductService.findById(id);
  if (!productService) {
    const err = new Error('Product/Service not found');
    err.status = 404;
    throw err;
  }

  Object.assign(productService, updateData);
  await productService.save();
  
  // Update index for smart search
  try {
    await indexProductService(productService);
  } catch (error) {
    console.warn(`⚠️ Background indexing failed for update of ${productService._id}:`, error.message);
  }
  
  return productService;
};

module.exports = { getByBusinessOwner, getById, create, update };
