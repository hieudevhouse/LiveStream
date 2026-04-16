const request = require('supertest');
const express = require('express');
const authRoutes = require('../../routes/auth');
const User = require('../../models/User');
const { dbConnect, dbDisconnect, dbClear } = require('../setup/dbSetup');

// Setup test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Authentication API - registerAuto', () => {
  beforeAll(async () => {
    await dbConnect();
  });

  afterAll(async () => {
    await dbDisconnect();
  });

  beforeEach(async () => {
    await dbClear();
  });

  describe('POST /api/auth/register-auto', () => {
    it('should auto-register user with new email and return status 201', async () => {
      const response = await request(app)
        .post('/api/auth/register-auto')
        .send({
          email: 'autouser@example.com'
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toBeDefined();
      expect(response.body.user.email).toBe('autouser@example.com');
      expect(response.body.user.role).toBe('customer');
      expect(response.body.user.isVerified).toBe(false);
    });

    it('should return 200 with message for duplicate email', async () => {
      // First auto-register
      await request(app)
        .post('/api/auth/register-auto')
        .send({
          email: 'autodup@example.com'
        });

      // Second auto-register with same email
      const response = await request(app)
        .post('/api/auth/register-auto')
        .send({
          email: 'autodup@example.com'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toBeDefined();
      expect(response.body.message).toContain('đã được sử dụng');
    });

    it('should return 400 when email is missing', async () => {
      const response = await request(app)
        .post('/api/auth/register-auto')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('email');
    });

    it('should create user with valid email address', async () => {
      const response = await request(app)
        .post('/api/auth/register-auto')
        .send({
          email: 'newuser@example.com'
        });

      expect(response.status).toBe(201);
      expect(response.body.user.email).toBe('newuser@example.com');
    });

    it('should detect duplicates case-insensitively', async () => {
      // First registration
      await request(app)
        .post('/api/auth/register-auto')
        .send({
          email: 'testuser@example.com'
        });

      // Second registration with uppercase
      const response = await request(app)
        .post('/api/auth/register-auto')
        .send({
          email: 'TESTUSER@EXAMPLE.COM'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toContain('được sử dụng');
    });
  });
});
