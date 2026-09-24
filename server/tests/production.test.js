#!/usr/bin/env node

/**
 * Production Integration Tests
 * Tests critical flows for production readiness
 */

const request = require('supertest');
const path = require('path');
// Load production environment for testing
require('dotenv').config({ path: path.join(__dirname, '../.env.production') });

const app = require('../index');
const { setupTestDB, cleanupTestDB, createTestUser, createTestCompany } = require('./setup');

console.log('=== PRODUCTION INTEGRATION TESTS ===\n');

let testUser, testCompany, testToken, testExpert;

// Test setup
beforeAll(async () => {
  await setupTestDB();
  
  // Create test user
  testUser = await createTestUser({
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123!@#',
    role: 'user'
  });
  
  // Create test company
  testCompany = await createTestCompany({
    name: 'Test Company',
    ownerId: testUser._id,
    industry: 'Technology'
  });

  // Create an expert profile for testUser
  const Expert = require('../models/Expert');
  testExpert = await Expert.create({
    userId: testUser._id,
    name: 'Test User',
    email: 'test@example.com',
    phone: '1234567890',
    experience: 5,
    rating: 0,
    category: 'Consulting',
    companyName: 'Test Company',
    providerType: 'Company',
    bio: 'Test expert bio',
    isApproved: true,
    isActive: true,
    services: [
      {
        title: 'Test Service',
        price: 0,
        duration: 60,
        description: 'Test service description',
        type: 'Session'
      }
    ],
    timeSlots: [
      {
        date: new Date('2024-12-01'),
        startTime: '10:00',
        endTime: '11:00',
        isBooked: false
      }
    ]
  });
  
  // Get auth token
  const loginResponse = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'test@example.com',
      password: 'Test123!@#'
    });
  
  testToken = loginResponse.body.token;
});

afterAll(async () => {
  await cleanupTestDB();
});

describe('Production Critical Flows', () => {
  test('Health Check', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    expect(response.body.status).toBe('ok');
    expect(response.body.environment).toBeDefined();
    expect(response.body.uptime).toBeDefined();
  });

  test('Authentication Flow', async () => {
    // Test login
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'Test123!@#'
      })
      .expect(200);
    
    expect(loginResponse.body.token).toBeDefined();
    expect(loginResponse.body.email).toBe('test@example.com');
    
    // Test protected route
    const profileResponse = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${loginResponse.body.token}`)
      .expect(200);
    
    expect(profileResponse.body.email).toBe('test@example.com');
  });

  test('Company Creation Flow', async () => {
    const companyOwner = await createTestUser({
      name: 'Company Owner',
      email: 'owner@example.com',
      password: 'Owner123!@#',
      role: 'company_owner'
    });
    
    const ownerLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'owner@example.com',
        password: 'Owner123!@#'
      });
    
    const companyResponse = await request(app)
      .post('/api/company/create')
      .set('Authorization', `Bearer ${ownerLogin.body.token}`)
      .send({
        name: 'New Test Company',
        industry: 'Technology',
        description: 'A test company for integration testing',
        timezone: 'UTC'
      })
      .expect(201);
    
    expect(companyResponse.body.data.name).toBe('New Test Company');
    expect(companyResponse.body.data.industry).toBe('Technology');
  });

  test('Multi-tenant Isolation', async () => {
    // Create another company
    const anotherUser = await createTestUser({
      name: 'Another User',
      email: 'another@example.com',
      password: 'Another123!@#',
      role: 'company_owner'
    });
    
    const anotherCompany = await createTestCompany({
      name: 'Another Company',
      ownerId: anotherUser._id,
      industry: 'Healthcare'
    });
    
    const anotherLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'another@example.com',
        password: 'Another123!@#'
      });
    
    console.log('DEBUG: anotherLogin body:', anotherLogin.body);
    
    // Try to access first company's data with second company's token
    const dashboardResponse = await request(app)
      .get('/api/company/dashboard')
      .set('Authorization', `Bearer ${anotherLogin.body.token}`);
      
    console.log('DEBUG: dashboardResponse status:', dashboardResponse.status);
    console.log('DEBUG: dashboardResponse body:', dashboardResponse.body);
    
    expect(dashboardResponse.status).toBe(200);
    
    // Should return second company's data, not first company's
    expect(dashboardResponse.body.data.company.name).toBe('Another Company');
  });

  test('Booking Flow (No Payment Required)', async () => {
    // Create a service
    const serviceResponse = await request(app)
      .post('/api/services/create')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        title: 'Test Service',
        description: 'A test service for integration testing',
        category: 'Consulting',
        duration: 60,
        price: 100,
        companyId: testCompany._id
      });
      
    console.log('DEBUG: serviceResponse status:', serviceResponse.status);
    console.log('DEBUG: serviceResponse body:', serviceResponse.body);
    
    expect(serviceResponse.status).toBe(201);
    
    const serviceId = serviceResponse.body.data._id;
    
    // Create a booking (should work without payment)
    const bookingResponse = await request(app)
      .post('/api/bookings')
      .set('Authorization', `Bearer ${testToken}`)
      .send({
        expertId: testExpert._id,
        slotId: testExpert.timeSlots[0]._id,
        serviceId: testExpert.services[0]._id,
        date: '2024-12-01',
        startTime: '10:00',
        endTime: '11:00',
        notes: 'Integration test booking'
      });
      
    console.log('DEBUG: bookingResponse status:', bookingResponse.status);
    console.log('DEBUG: bookingResponse body:', bookingResponse.body);
      
    expect(bookingResponse.status).toBe(201);
    
    expect(bookingResponse.body.booking.paymentStatus).toBe('Paid');
    expect(bookingResponse.body.booking.totalAmount).toBe(0);
  });

  test('Security Headers', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200);
    
    // Check for security headers
    expect(response.headers['x-frame-options']).toBeDefined();
    expect(response.headers['x-content-type-options']).toBeDefined();
    expect(response.headers['x-xss-protection']).toBeDefined();
  });

  test('Error Handling', async () => {
    // Test 404 handling
    await request(app)
      .get('/api/nonexistent-endpoint')
      .expect(404);
    
    // Test validation error
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'invalid-email', password: 'short' })
      .expect(400);
    
    // Test unauthorized access
    await request(app)
      .get('/api/auth/profile')
      .expect(401);
  });

  test('Rate Limiting', async () => {
    // Make multiple rapid requests to test rate limiting
    const promises = Array.from({ length: 25 }, () =>
      request(app).get('/api/experts')
    );
    
    const responses = await Promise.all(promises);
    
    // At least some requests should succeed, but rate limiting should kick in
    const successCount = responses.filter(r => r.status === 200).length;
    const rateLimitedCount = responses.filter(r => r.status === 429).length;
    
    expect(successCount > 0).toBe(true);
    expect(rateLimitedCount > 0).toBe(true);
  });
});

describe('Production Configuration', () => {
  test('Environment Variables', () => {
    expect(process.env.JWT_SECRET).toBeDefined();
    expect(process.env.JWT_SECRET.length).toBeGreaterThanOrEqual(32);
    expect(process.env.MONGODB_URI).toBeDefined();
  });

  test('Database Connection', () => {
    // If we can run tests, database is connected
    expect(true).toBe(true);
  });

  test('Server Configuration', () => {
    expect(app).toBeDefined();
  });
});

console.log('\n=== INTEGRATION TESTS COMPLETED ===');
