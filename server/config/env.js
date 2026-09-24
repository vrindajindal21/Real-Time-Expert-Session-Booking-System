/**
 * Centralized Environment Configuration
 * Supports DEV, STAGING, and PRODUCTION environments
 */

const path = require('path');
require('dotenv').config();

// Environment detection
const getEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return env.toLowerCase();
};

// Base configuration
const env = getEnvironment();
const isProduction = env === 'production';
const isStaging = env === 'staging';
const isDevelopment = env === 'development';

// Server configuration
const serverConfig = {
  port: process.env.PORT || (isProduction ? 5000 : 5000),
  host: process.env.HOST || '0.0.0.0',
  environment: env,
  isProduction,
  isStaging,
  isDevelopment
};

// Database configuration
const databaseConfig = {
  mongodb: {
    uri: process.env.MONGODB_URI,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: isProduction ? 10 : 5,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    }
  },
  redis: {
    url: process.env.REDIS_URL,
    options: {
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
    }
  }
};

// Security configuration
const securityConfig = {
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: process.env.JWT_ISSUER || 'expert-booking',
    audience: process.env.JWT_AUDIENCE || 'expert-booking-users'
  },
  bcrypt: {
    saltRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12
  },
  session: {
    secret: process.env.SESSION_SECRET,
    maxAge: process.env.SESSION_MAX_AGE || 24 * 60 * 60 * 1000 // 24 hours
  }
};

// CORS configuration
const corsConfig = {
  development: {
    origins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001'
    ],
    credentials: true
  },
  staging: {
    origins: [
      process.env.FRONTEND_URL || 'https://staging.your-domain.com',
      process.env.MOBILE_URL || 'https://staging.your-domain.com'
    ],
    credentials: true
  },
  production: {
    origins: [
      process.env.FRONTEND_URL,
      process.env.MOBILE_URL
    ].filter(Boolean),
    credentials: true
  }
};

// API URLs for different environments
const apiConfig = {
  development: {
    baseUrl: `http://localhost:${serverConfig.port}/api`,
    wsUrl: `http://localhost:${serverConfig.port}`,
    frontendUrl: 'http://localhost:3000'
  },
  staging: {
    baseUrl: process.env.API_BASE_URL || 'https://api-staging.your-domain.com',
    wsUrl: process.env.WS_BASE_URL || 'https://api-staging.your-domain.com',
    frontendUrl: process.env.FRONTEND_URL || 'https://staging.your-domain.com'
  },
  production: {
    baseUrl: process.env.API_BASE_URL || 'https://api.your-domain.com',
    wsUrl: process.env.WS_BASE_URL || 'https://api.your-domain.com',
    frontendUrl: process.env.FRONTEND_URL
  }
};

// Email configuration
const emailConfig = {
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  from: process.env.EMAIL_FROM || 'noreply@your-domain.com'
};

// Payment configuration
const paymentConfig = {
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET
  },
  enabled: !!process.env.STRIPE_SECRET_KEY
};

// File storage configuration
const storageConfig = {
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET
  },
  enabled: !!(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY)
};

// Logging configuration
const loggingConfig = {
  level: process.env.LOG_LEVEL || (isProduction ? 'info' : 'debug'),
  morganFormat: isProduction ? 'combined' : 'dev',
  enableFileLogging: isProduction,
  enableExternalLogging: !!process.env.SENTRY_DSN,
  sentryDsn: process.env.SENTRY_DSN
};

// Monitoring configuration
const monitoringConfig = {
  healthCheck: {
    enabled: true,
    path: '/health',
    interval: 30000 // 30 seconds
  },
  metrics: {
    enabled: isProduction,
    path: '/metrics'
  }
};

// Get environment-specific configuration
const getConfig = (type = 'all') => {
  const config = {
    server: serverConfig,
    database: databaseConfig,
    security: securityConfig,
    cors: corsConfig[env] || corsConfig.development,
    api: apiConfig[env] || apiConfig.development,
    email: emailConfig,
    payment: paymentConfig,
    storage: storageConfig,
    logging: loggingConfig,
    monitoring: monitoringConfig
  };
  
  return type === 'all' ? config : config[type];
};

// Validation helper
const validateConfig = () => {
  const errors = [];
  const warnings = [];
  
  // Required fields
  const required = [
    'MONGODB_URI',
    'JWT_SECRET'
  ];
  
  required.forEach(field => {
    if (!process.env[field]) {
      errors.push(`Missing required environment variable: ${field}`);
    }
  });
  
  // Production-specific validations
  if (isProduction) {
    if (!process.env.FRONTEND_URL) {
      warnings.push('FRONTEND_URL not set - CORS may not work properly');
    }
    
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
      errors.push('JWT_SECRET must be at least 32 characters in production');
    }
    
    if (!process.env.EMAIL_HOST) {
      warnings.push('Email service not configured - email features will be disabled');
    }
  }
  
  return { errors, warnings };
};

// Export configuration
module.exports = {
  getConfig,
  validateConfig,
  env,
  isProduction,
  isStaging,
  isDevelopment
};
