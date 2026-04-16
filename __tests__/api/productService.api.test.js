const request = require('supertest');
const express = require('express');
const multer = require('multer');
const productServiceRoutes = require('../../routes/productsServices');
const User = require('../../models/User');
const BusinessOwner = require('../../models/BusinessOwner');
const { dbConnect, dbDisconnect, dbClear } = require('../setup/dbSetup');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/products-services', productServiceRoutes);

describe('Product/Service API - create', () => {
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

  describe('POST /api/products-services', () => {
    it('should create a new product with required fields', async () => {
      const response = await request(app)
        .post('/api/products-services')
        .send({
          businessOwnerId: testBusinessOwnerId,
          name: 'Test Product',
          type: 'product',
          businessField: 'Technology'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toContain('created successfully');
      expect(response.body.productService.name).toBe('Test Product');
      expect(response.body.productService.type).toBe('product');
    });

    it('should return 200 when creating second product for same owner', async () => {
      // Create first product
      await request(app)
        .post('/api/products-services')
        .send({
          businessOwnerId: testBusinessOwnerId,
          name: 'First Product',
          type: 'product',
          businessField: 'Tech'
        });

      // Try to create second product
      const response = await request(app)
        .post('/api/products-services')
        .send({
          businessOwnerId: testBusinessOwnerId,
          name: 'Second Product',
          type: 'service',
          businessField: 'Tech'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('đã tồn tại');
    });

    it('should handle file paths in description', async () => {
      const response = await request(app)
        .post('/api/products-services')
        .send({
          businessOwnerId: testBusinessOwnerId,
          name: 'Product with Files',
          type: 'product',
          businessField: 'Tech',
          description: {
            images: ['uploads/image1.jpg'],
            documents: ['uploads/doc1.pdf'],
            keywords: ['test']
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.productService.description.images).toEqual(['uploads/image1.jpg']);
      expect(response.body.productService.description.documents).toEqual(['uploads/doc1.pdf']);
    });

    it('should store intellectual property certificate', async () => {
      const response = await request(app)
        .post('/api/products-services')
        .send({
          businessOwnerId: testBusinessOwnerId,
          name: 'Product with IP',
          type: 'product',
          businessField: 'Tech',
          product: {
            intellectualProperty: {
              certificate: 'uploads/certificate.pdf'
            }
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.productService.product.intellectualProperty.certificate).toBe('uploads/certificate.pdf');
    });

    it('should store operating license for service', async () => {
      const response = await request(app)
        .post('/api/products-services')
        .send({
          businessOwnerId: testBusinessOwnerId,
          name: 'Service with License',
          type: 'service',
          businessField: 'Tech',
          service: {
            operatingLicense: 'uploads/license.pdf'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.productService.service.operatingLicense).toBe('uploads/license.pdf');
    });

    it('should store multiple certifications', async () => {
      const response = await request(app)
        .post('/api/products-services')
        .send({
          businessOwnerId: testBusinessOwnerId,
          name: 'Product with Certifications',
          type: 'product',
          businessField: 'Tech',
          certifications: [
            { name: 'ISO 9001', certificate: 'uploads/cert1.pdf' },
            { name: 'ISO 14001', certificate: 'uploads/cert2.pdf' }
          ]
        });

      expect(response.status).toBe(201);
      expect(response.body.productService.certifications).toHaveLength(2);
    });
  });
});
