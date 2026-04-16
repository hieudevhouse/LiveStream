const collaborationNeedService = require('../../services/collaborationNeed.service');
const User = require('../../models/User');
const BusinessOwner = require('../../models/BusinessOwner');
const ProductService = require('../../models/ProductService');
const CollaborationNeed = require('../../models/CollaborationNeed');
const { dbConnect, dbDisconnect, dbClear } = require('../setup/dbSetup');

describe('Collaboration Need Service - upsertCollaborationNeed', () => {
  let testBusinessOwnerId;
  let testProductServiceId;

  beforeAll(async () => {
    await dbConnect();
  });

  afterAll(async () => {
    await dbDisconnect();
  });

  beforeEach(async () => {
    await dbClear();

    // Create test user
    const testUser = new User({
      email: 'test@example.com',
      password: null,
      role: 'admin'
    });
    await testUser.save();

    // Create business owner
    const businessOwner = new BusinessOwner({
      userId: testUser._id,
      ownershipType: 'business',
      businessName: 'Test Business',
      taxCode: '123456789',
      email: 'business@example.com'
    });

    await businessOwner.save();
    testBusinessOwnerId = businessOwner._id;

    // Create product service
    const productService = new ProductService({
      businessOwnerId: testBusinessOwnerId,
      name: 'Test Product',
      type: 'product',
      businessField: 'Technology'
    });

    await productService.save();
    testProductServiceId = productService._id;
  });

  describe('upsertCollaborationNeed()', () => {

    it('should create new collaboration need if not exists', async () => {
      const collaborationData = {
        businessOwnerId: testBusinessOwnerId,
        productServiceId: testProductServiceId,
        needs: [
          {
            type: 'product_service_promotion',
            description: 'Need marketing collaboration'
          }
        ]
      };

      const result = await collaborationNeedService.upsertCollaborationNeed(collaborationData);

      expect(result).toBeDefined();
      expect(result.needs).toHaveLength(1);
      expect(result.needs[0].type).toBe('product_service_promotion');
      expect(result.businessOwnerId.toString()).toBe(testBusinessOwnerId.toString());
      expect(result.productServiceId.toString()).toBe(testProductServiceId.toString());
    });

    it('should update existing collaboration need if already exists', async () => {
      // create first
      await CollaborationNeed.create({
        businessOwnerId: testBusinessOwnerId,
        productServiceId: testProductServiceId,
        needs: [
          {
            type: 'market_development',
            description: 'Old description'
          }
        ]
      });

      // update
      const updateData = {
        businessOwnerId: testBusinessOwnerId,
        productServiceId: testProductServiceId,
        needs: [
          {
            type: 'market_development',
            description: 'Updated description'
          }
        ]
      };

      const result = await collaborationNeedService.upsertCollaborationNeed(updateData);

      expect(result.needs).toHaveLength(1);
      expect(result.needs[0].description).toBe('Updated description');
    });

    it('should not create duplicate collaboration need', async () => {
      const data = {
        businessOwnerId: testBusinessOwnerId,
        productServiceId: testProductServiceId,
        needs: [
          {
            type: 'investment_connection',
            description: 'Test description'
          }
        ]
      };

      await collaborationNeedService.upsertCollaborationNeed(data);
      await collaborationNeedService.upsertCollaborationNeed(data);

      const records = await CollaborationNeed.find({
        businessOwnerId: testBusinessOwnerId,
        productServiceId: testProductServiceId
      });

      expect(records).toHaveLength(1);
    });

  });

});