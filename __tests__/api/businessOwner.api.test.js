const request = require('supertest');
const express = require('express');
const businessOwnerRoutes = require('../../routes/businessOwners');
const User = require('../../models/User');
const BusinessOwner = require('../../models/BusinessOwner');
const { dbConnect, dbDisconnect, dbClear } = require('../setup/dbSetup');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/business-owners', businessOwnerRoutes);

describe('Business Owner API', () => {
  let testUserId;

  beforeAll(async () => {
    await dbConnect();
  });

  afterAll(async () => {
    await dbDisconnect();
  });

  beforeEach(async () => {
    await dbClear();
    // Create a test user
    const testUser = new User({
      email: 'test@example.com',
      password: null,
      role: 'admin'
    });
    await testUser.save();
    testUserId = testUser._id;
  });

  describe('POST /api/business-owners/upsert', () => {
    it('should create a new business owner', async () => {
      const response = await request(app)
        .post('/api/business-owners/upsert')
        .send({
          userId: testUserId,
          ownershipType: 'business',
          businessName: 'Test Business',
          taxCode: '123456789',
          email: 'business@example.com',
          phone: '0123456789',
          address: '123 Test St'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.businessOwner.businessName).toBe('Test Business');
      expect(response.body.businessOwner.taxCode).toBe('123456789');
    });

    it('should update an existing business owner', async () => {
      // Create initial business owner
      await request(app)
        .post('/api/business-owners/upsert')
        .send({
          userId: testUserId,
          ownershipType: 'business',
          businessName: 'Initial Business',
          taxCode: '123456789',
          email: 'initial@example.com'
        });

      // Update the business owner
      const response = await request(app)
        .post('/api/business-owners/upsert')
        .send({
          userId: testUserId,
          businessName: 'Updated Business Name',
          taxCode: '123456789',
          email: 'updated@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.businessOwner.businessName).toBe('Updated Business Name');
    });
  });

  describe('POST /api/business-owners/check-tax', () => {
    it('should return available=true for unique tax code', async () => {
      const response = await request(app)
        .post('/api/business-owners/check-tax')
        .send({
          taxCode: 'unique123'
        });

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(true);
      expect(response.body.message).toContain('Có thể sử dụng');
    });

    it('should return tax code status for existing code', async () => {
      // Create business owner with tax code
      await request(app)
        .post('/api/business-owners/upsert')
        .send({
          userId: testUserId,
          ownershipType: 'business',
          businessName: 'Test',
          taxCode: 'existing123',
          email: 'test@example.com'
        });

      const response = await request(app)
        .post('/api/business-owners/check-tax')
        .send({
          taxCode: 'existing123'
        });

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(false);
      expect(response.body.message).toContain('Mã số thuế đã tồn tại');
    });

    it('should return 400 when tax code is missing', async () => {
      const response = await request(app)
        .post('/api/business-owners/check-tax')
        .send({
          taxCode: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Thiếu');
    });
  });

  describe('POST /api/business-owners/check-email', () => {
    it('should return available=true for unique email', async () => {
      const response = await request(app)
        .post('/api/business-owners/check-email')
        .send({
          email: 'unique@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(true);
      expect(response.body.message).toContain('Có thể sử dụng');
    });

    it('should return email status for existing email', async () => {
      // Create business owner with email
      await request(app)
        .post('/api/business-owners/upsert')
        .send({
          userId: testUserId,
          ownershipType: 'business',
          businessName: 'Test',
          taxCode: '123456',
          email: 'existing@example.com'
        });

      const response = await request(app)
        .post('/api/business-owners/check-email')
        .send({
          email: 'existing@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(false);
      expect(response.body.message).toContain('đã được sử dụng');
    });

    it('should handle email case-insensitively', async () => {
      // Create with lowercase
      await request(app)
        .post('/api/business-owners/upsert')
        .send({
          userId: testUserId,
          ownershipType: 'business',
          businessName: 'Test',
          taxCode: '123456',
          email: 'case@example.com'
        });

      // Check with uppercase
      const response = await request(app)
        .post('/api/business-owners/check-email')
        .send({
          email: 'CASE@EXAMPLE.COM'
        });

      expect(response.status).toBe(200);
      expect(response.body.available).toBe(false);
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/business-owners/check-email')
        .send({
          email: ''
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Thiếu');
    });
  });
});
