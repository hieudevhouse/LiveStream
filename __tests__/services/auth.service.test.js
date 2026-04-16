const authService = require('../../services/auth.service');
const User = require('../../models/User');
const { dbConnect, dbDisconnect, dbClear } = require('../setup/dbSetup');

describe('Authentication Service - registerAuto', () => {
  beforeAll(async () => {
    await dbConnect();
  });

  afterAll(async () => {
    await dbDisconnect();
  });

  beforeEach(async () => {
    await dbClear();
  });

  describe('registerAuto()', () => {
    it('should auto-register a new user with new email', async () => {
      const result = await authService.registerAuto('test@example.com');

      expect(result.isDuplicate).toBe(false);
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.password).toBeNull();
      expect(result.user.role).toBe('customer');
      expect(result.user.isVerified).toBe(false);
    });

    it('should return existing user when auto-registering with duplicate email', async () => {
      // First registration
      const firstResult = await authService.registerAuto('duplicate@example.com');
      expect(firstResult.isDuplicate).toBe(false);

      // Second registration with same email
      const secondResult = await authService.registerAuto('duplicate@example.com');
      expect(secondResult.isDuplicate).toBe(true);
      expect(secondResult.user._id.toString()).toBe(firstResult.user._id.toString());
    });

    it('should throw error when auto-registering with missing email', async () => {
      await expect(authService.registerAuto(null)).rejects.toThrow();
      await expect(authService.registerAuto('')).rejects.toThrow();
    });

    it('should create user with valid email format', async () => {
      const result = await authService.registerAuto('valid.email+tag@example.com');
      expect(result.isDuplicate).toBe(false);
      expect(result.user.email).toBe('valid.email+tag@example.com');
    });

    it('should handle duplicate detection case-insensitively', async () => {
      // First registration
      await authService.registerAuto('case@example.com');

      // Second registration with uppercase
      const result = await authService.registerAuto('CASE@EXAMPLE.COM');
      expect(result.isDuplicate).toBe(true);
    });

    it('should create unverified user on auto-register', async () => {
      const result = await authService.registerAuto('unverified@example.com');
      expect(result.user.isVerified).toBe(false);
    });

    it('should create user with customer role on auto-register', async () => {
      const result = await authService.registerAuto('customer@example.com');
      expect(result.user.role).toBe('customer');
    });
  });
});
