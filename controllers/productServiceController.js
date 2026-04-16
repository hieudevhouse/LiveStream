const productServiceService = require('../services/productService.service');

const getByBusinessOwner = async (req, res) => {
  try {
    const productsServices = await productServiceService.getByBusinessOwner(req.params.businessOwnerId);
    res.json(productsServices);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const getById = async (req, res) => {
  try {
    const productService = await productServiceService.getById(req.params.id);
    res.json(productService);
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const create = async (req, res) => {
  try {
    const productServiceData = req.body;

    if (req.files) {
      if (req.files.descriptionImages) {
        productServiceData.description = productServiceData.description || {};
        productServiceData.description.images = req.files.descriptionImages.map(file => file.path);
      }
      if (req.files.descriptionDocuments) {
        productServiceData.description = productServiceData.description || {};
        productServiceData.description.documents = req.files.descriptionDocuments.map(file => file.path);
      }
      if (req.files.intellectualPropertyCertificate) {
        productServiceData.product = productServiceData.product || {};
        productServiceData.product.intellectualProperty = productServiceData.product.intellectualProperty || {};
        productServiceData.product.intellectualProperty.certificate = req.files.intellectualPropertyCertificate[0].path;
      }
      if (req.files.operatingLicense) {
        productServiceData.service = productServiceData.service || {};
        productServiceData.service.operatingLicense = req.files.operatingLicense[0].path;
      }
      if (req.files.certificationFiles) {
        productServiceData.certifications = productServiceData.certifications || [];
        req.files.certificationFiles.forEach((file, index) => {
          if (productServiceData.certifications[index]) {
            productServiceData.certifications[index].certificate = file.path;
          }
        });
      }
    }

    const result = await productServiceService.create(productServiceData);
    if (result.isDuplicate) {
      return res.status(200).json({ message: 'Product/Service đã tồn tại, sử dụng bản cũ', productService: result.productService });
    }

    res.status(201).json({ message: 'Product/Service created successfully', productService: result.productService });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

const update = async (req, res) => {
  try {
    const existingProductService = await productServiceService.getById(req.params.id);
    const updateData = req.body;

    if (req.files) {
      if (req.files.descriptionImages) {
        updateData.description = updateData.description || existingProductService.description || {};
        updateData.description.images = [
          ...(existingProductService.description?.images || []),
          ...req.files.descriptionImages.map(file => file.path)
        ];
      }
      if (req.files.descriptionDocuments) {
        updateData.description = updateData.description || existingProductService.description || {};
        updateData.description.documents = [
          ...(existingProductService.description?.documents || []),
          ...req.files.descriptionDocuments.map(file => file.path)
        ];
      }
      if (req.files.intellectualPropertyCertificate) {
        updateData.product = updateData.product || existingProductService.product || {};
        updateData.product.intellectualProperty = updateData.product.intellectualProperty || existingProductService.product?.intellectualProperty || {};
        updateData.product.intellectualProperty.certificate = req.files.intellectualPropertyCertificate[0].path;
      }
      if (req.files.operatingLicense) {
        updateData.service = updateData.service || existingProductService.service || {};
        updateData.service.operatingLicense = req.files.operatingLicense[0].path;
      }
      if (req.files.certificationFiles) {
        updateData.certifications = updateData.certifications || existingProductService.certifications || [];
        req.files.certificationFiles.forEach((file, index) => {
          if (updateData.certifications[index]) {
            updateData.certifications[index].certificate = file.path;
          }
        });
      }
    }

    const updatedProductService = await productServiceService.update(req.params.id, updateData);
    res.json({ message: 'Product/Service updated successfully', productService: updatedProductService });
  } catch (error) {
    res.status(error.status || 500).json({ message: error.message });
  }
};

module.exports = { getByBusinessOwner, getById, create, update };
