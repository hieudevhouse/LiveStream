const businessOwnerService = require('../../services/businessOwner.service');
const User = require('../../models/User');
const BusinessOwner = require('../../models/BusinessOwner');
const { dbConnect, dbDisconnect, dbClear } = require('../setup/dbSetup');

describe('Business Owner Service', () => {
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

  describe('upsert()', () => {
    it('should create a new business owner', async () => {
      const businessOwnerData = {
        userId: testUserId,
        ownershipType: 'business',
        businessName: 'Test Business',
        taxCode: '123456789',
        email: 'business@example.com',
        phone: '0123456789',
        address: '123 Test St'
      };

      const result = await businessOwnerService.upsert(businessOwnerData);

      expect(result).toBeDefined();
      expect(result.businessName).toBe('Test Business');
      expect(result.taxCode).toBe('123456789');
      expect(result.userId.toString()).toBe(testUserId.toString());
    });

    it('should update an existing business owner', async () => {
      // Create initial business owner
      const initialData = {
        userId: testUserId,
        ownershipType: 'business',
        businessName: 'Initial Business',
        taxCode: '123456789',
        email: 'initial@example.com'
      };
      const initial = await businessOwnerService.upsert(initialData);

      // Update the business owner
      const updateData = {
        userId: testUserId,
        businessName: 'Updated Business',
        taxCode: '123456789',
        email: 'updated@example.com'
      };
      const updated = await businessOwnerService.upsert(updateData);

      expect(updated.businessName).toBe('Updated Business');
      expect(updated.email).toBe('updated@example.com');
      expect(updated._id.toString()).toBe(initial._id.toString());
    });
  });

  describe('checkTax()', () => {
    it('should return available=true for unique tax code', async () => {
      const result = await businessOwnerService.checkTax('unique123');
      expect(result.available).toBe(true);
      expect(result.message).toContain('Có thể sử dụng');
    });

    it('should return available=false for existing tax code', async () => {
      // Create business owner with tax code
      await businessOwnerService.upsert({
        userId: testUserId,
        ownershipType: 'business',
        businessName: 'Test',
        taxCode: 'existing123',
        email: 'test@example.com'
      });

      const result = await businessOwnerService.checkTax('existing123');
      expect(result.available).toBe(false);
      expect(result.message).toContain('Mã số thuế đã tồn tại');
    });

    it('should throw error for missing tax code', async () => {
      await expect(businessOwnerService.checkTax(null)).rejects.toThrow();
      await expect(businessOwnerService.checkTax('')).rejects.toThrow();
    });
  });

  describe('checkEmail()', () => {
    it('should return available=true for unique email', async () => {
      const result = await businessOwnerService.checkEmail('unique@example.com');
      expect(result.available).toBe(true);
      expect(result.message).toContain('Có thể sử dụng');
    });

    it('should return available=false for existing email', async () => {
      // Create business owner with email
      await businessOwnerService.upsert({
        userId: testUserId,
        ownershipType: 'business',
        businessName: 'Test',
        taxCode: '123456',
        email: 'existing@example.com'
      });

      const result = await businessOwnerService.checkEmail('existing@example.com');
      expect(result.available).toBe(false);
      expect(result.message).toContain('đã được sử dụng');
    });

    it('should handle email case-insensitively', async () => {
      // Create with lowercase
      await businessOwnerService.upsert({
        userId: testUserId,
        ownershipType: 'business',
        businessName: 'Test',
        taxCode: '123456',
        email: 'case@example.com'
      });

      // Check with uppercase
      const result = await businessOwnerService.checkEmail('CASE@EXAMPLE.COM');
      expect(result.available).toBe(false);
    });

    it('should throw error for missing email', async () => {
      await expect(businessOwnerService.checkEmail(null)).rejects.toThrow();
      await expect(businessOwnerService.checkEmail('')).rejects.toThrow();
    });
  });
});
