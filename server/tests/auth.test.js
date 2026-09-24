const request = require('supertest');
const app = require('../index');
const User = require('../models/User');

describe('Authentication Endpoints', () => {
  describe('POST /api/auth/register', () => {
    it('should register a new user successfully', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'Password123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body.email).toBe(userData.email);
      expect(response.body.token).toBeDefined();
      expect(response.body.password).toBeUndefined(); // Password should not be returned
    });

    it('should not register user with invalid email', async () => {
      const userData = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'Password123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should not register user with weak password', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: '123',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });

    it('should not register user with existing email', async () => {
      // Create user first
      await global.testUtils.createTestUser({
        email: 'existing@example.com'
      });

      const userData = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'Password123!',
        role: 'user'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body.message).toContain('already exists');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await global.testUtils.createTestUser({
        email: 'login@example.com',
        password: 'Password123!'
      });
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(200);

      expect(response.body.token).toBeDefined();
      expect(response.body.email).toBe(loginData.email);
    });

    it('should not login user with invalid email', async () => {
      const loginData = {
        email: 'wrong@example.com',
        password: 'Password123!'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(404);

      expect(response.body.message).toBeDefined();
    });

    it('should not login user with invalid password', async () => {
      const loginData = {
        email: 'login@example.com',
        password: 'wrongpassword'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should not login with missing fields', async () => {
      const loginData = {
        email: 'login@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('GET /api/auth/profile', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await global.testUtils.createTestUser({
        email: 'profile@example.com'
      });
      token = global.testUtils.generateTestToken(user._id);
    });

    it('should get user profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.email).toBe(user.email);
      expect(response.body.password).toBeUndefined();
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.message).toBeDefined();
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('PUT /api/auth/profile', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await global.testUtils.createTestUser({
        email: 'update@example.com'
      });
      token = global.testUtils.generateTestToken(user._id);
    });

    it('should update user profile successfully', async () => {
      const updateData = {
        name: 'Updated Name',
        phone: '+1234567890'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.name).toBe(updateData.name);
    });

    it('should not update profile with invalid data', async () => {
      const updateData = {
        name: '', // Invalid: empty name
        phone: 'invalid-phone'
      };

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(400);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/auth/logout', () => {
    let token;
    let user;

    beforeEach(async () => {
      user = await global.testUtils.createTestUser({
        email: 'logout-test@example.com'
      });
      token = global.testUtils.generateTestToken(user._id);
    });

    it('should successfully log out and invalidate the token', async () => {
      // Confirm token works before logout
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Perform logout to blacklist the token
      await request(app)
        .post('/api/auth/logout')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      // Verify the token is now rejected
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(401);

      expect(response.body.message).toContain('logged out');
    });
  });
});
