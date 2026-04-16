const productServiceService = require('../../services/productService.service');
const User = require('../../models/User');
const BusinessOwner = require('../../models/BusinessOwner');
const { dbConnect, dbDisconnect, dbClear } = require('../setup/dbSetup');

describe('Product/Service Service - create', () => {
  let testBusinessOwnerId;

  beforeAll(async () => {
    await dbConnect();
  });

  afterAll(async () => {
    await dbDisconnect();
  });

  beforeEach(async () => {
    await dbClear();
    // Create test user and business owner
    const testUser = new User({
      email: 'test@example.com',
      password: null,
      role: 'admin'
    });
    await testUser.save();

    const businessOwner = new BusinessOwner({
      userId: testUser._id,
      ownershipType: 'business',
      businessName: 'Test Business',
      taxCode: '123456789',
      email: 'business@example.com'
    });
    await businessOwner.save();
    testBusinessOwnerId = businessOwner._id;
  });

  describe('create()', () => {
    it('should create a new product/service with required fields', async () => {
      const productData = {
        businessOwnerId: testBusinessOwnerId,
        name: 'Test Product',
        type: 'product',
        businessField: 'Technology'
      };

      const result = await productServiceService.create(productData);

      expect(result.isDuplicate).toBe(false);
      expect(result.productService).toBeDefined();
      expect(result.productService.name).toBe('Test Product');
      expect(result.productService.type).toBe('product');
      expect(result.productService.businessOwnerId.toString()).toBe(testBusinessOwnerId.toString());
    });

    it('should allow creating multiple products/services for the same business owner when names differ', async () => {
      const firstData = {
        businessOwnerId: testBusinessOwnerId,
        name: 'First Product',
        type: 'product',
        businessField: 'Tech'
      };

      const first = await productServiceService.create(firstData);
      expect(first.isDuplicate).toBe(false);

      const secondData = {
        businessOwnerId: testBusinessOwnerId,
        name: 'Second Product',
        type: 'service',
        businessField: 'Tech'
      };

      const second = await productServiceService.create(secondData);
      expect(second.isDuplicate).toBe(false);
      expect(second.productService._id.toString()).not.toBe(first.productService._id.toString());
    });

    it('should create product with file paths for descriptions', async () => {
      const productData = {
        businessOwnerId: testBusinessOwnerId,
        name: 'Product with Files',
        type: 'product',
        businessField: 'Tech',
        description: {
          images: ['uploads/image1.jpg', 'uploads/image2.png'],
          documents: ['uploads/doc1.pdf'],
          keywords: ['test', 'product']
        }
      };

      const result = await productServiceService.create(productData);
      expect(result.isDuplicate).toBe(false);
      expect(result.productService.description.images).toEqual(['uploads/image1.jpg', 'uploads/image2.png']);
      expect(result.productService.description.documents).toEqual(['uploads/doc1.pdf']);
    });

    it('should store intellectual property certificate', async () => {
      const productData = {
        businessOwnerId: testBusinessOwnerId,
        name: 'Product with IP',
        type: 'product',
        businessField: 'Tech',
        product: {
          intellectualProperty: {
            certificate: 'uploads/certificate.pdf'
          }
        }
      };

      const result = await productServiceService.create(productData);
      expect(result.productService.product.intellectualProperty.certificate).toBe('uploads/certificate.pdf');
    });

    it('should store operating license for service', async () => {
      const serviceData = {
        businessOwnerId: testBusinessOwnerId,
        name: 'Service with License',
        type: 'service',
        businessField: 'Tech',
        service: {
          operatingLicense: 'uploads/license.pdf'
        }
      };

      const result = await productServiceService.create(serviceData);
      expect(result.productService.service.operatingLicense).toBe('uploads/license.pdf');
    });

    it('should store multiple certifications', async () => {
      const productData = {
        businessOwnerId: testBusinessOwnerId,
        name: 'Product with Certifications',
        type: 'product',
        businessField: 'Tech',
        certifications: [
          { name: 'ISO 9001', certificate: 'uploads/cert1.pdf' },
          { name: 'ISO 14001', certificate: 'uploads/cert2.pdf' }
        ]
      };

      const result = await productServiceService.create(productData);
      expect(result.productService.certifications).toHaveLength(2);
      expect(result.productService.certifications[0].name).toBe('ISO 9001');
      expect(result.productService.certifications[1].certificate).toBe('uploads/cert2.pdf');
    });
  });
});
