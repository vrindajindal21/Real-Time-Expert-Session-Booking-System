const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

// Setup test database function
const setupTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    return;
  }
  if (!mongoServer) {
    mongoServer = await MongoMemoryServer.create();
  }
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
};

// Cleanup test database function
const cleanupTestDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

// Global utilities
const createTestUser = async (userData = {}) => {
  const User = require('../models/User');
  const defaultUser = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'Test123!@#',
    role: 'user',
    ...userData
  };
  
  return await User.create(defaultUser);
};

const createTestCompany = async (companyData = {}) => {
  const Company = require('../models/Company');
  const User = require('../models/User');
  
  let ownerId = companyData.ownerId;
  if (!ownerId) {
    const owner = await createTestUser({ role: 'company_owner', email: `owner-${Date.now()}@example.com` });
    ownerId = owner._id;
  }
  
  const defaultCompany = {
    name: 'Test Company',
    industry: 'Technology',
    description: 'A test company for testing purposes',
    ownerId: ownerId,
    timezone: 'UTC',
    workingHours: {
      monday: { open: '09:00', close: '17:00', closed: false },
      tuesday: { open: '09:00', close: '17:00', closed: false },
      wednesday: { open: '09:00', close: '17:00', closed: false },
      thursday: { open: '09:00', close: '17:00', closed: false },
      friday: { open: '09:00', close: '17:00', closed: false },
      saturday: { open: '09:00', close: '17:00', closed: true },
      sunday: { open: '09:00', close: '17:00', closed: true }
    },
    ...companyData
  };
  
  const company = await Company.create(defaultCompany);
  
  // Link owner back to the company and update their role
  await User.findByIdAndUpdate(ownerId, { 
    companyId: company._id,
    role: 'company_owner'
  });
  
  return company;
};

const jwt = require('jsonwebtoken');

// Global utilities helper
const generateTestToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'testsecret', { expiresIn: '1d' });
};

global.testUtils = {
  createTestUser,
  createTestCompany,
  generateTestToken
};

// Automatic hooks for all tests
beforeAll(async () => {
  await setupTestDB();
});

afterAll(async () => {
  await cleanupTestDB();
});

beforeEach(async () => {
  const testPath = expect.getState().testPath;
  if (testPath && testPath.includes('production.test.js')) {
    return; // Skip clearing database for multi-step integration tests
  }
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany();
    }
  }
});

module.exports = {
  setupTestDB,
  cleanupTestDB,
  createTestUser,
  createTestCompany,
  generateTestToken
};
