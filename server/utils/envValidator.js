const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Required environment variables with their validation rules
const requiredEnvVars = {
  NODE_ENV: {
    required: true,
    values: ['development', 'production', 'test'],
    default: 'development'
  },
  PORT: {
    required: false,
    type: 'number',
    default: 3001
  },
  MONGODB_URI: {
    required: true,
    type: 'string',
    pattern: /^mongodb(\+srv)?:\/\//
  },
  JWT_SECRET: {
    required: true,
    type: 'string',
    minLength: 32
  },
  EMAIL_HOST: {
    required: false,
    type: 'string'
  },
  EMAIL_PORT: {
    required: false,
    type: 'number',
    default: 587
  },
  EMAIL_USER: {
    required: false,
    type: 'string'
  },
  EMAIL_PASS: {
    required: false,
    type: 'string'
  },
  STRIPE_SECRET_KEY: {
    required: false,
    type: 'string',
    pattern: /^sk_/
  },
  STRIPE_WEBHOOK_SECRET: {
    required: false,
    type: 'string'
  },
  CLOUDINARY_CLOUD_NAME: {
    required: false,
    type: 'string'
  },
  CLOUDINARY_API_KEY: {
    required: false,
    type: 'string'
  },
  CLOUDINARY_API_SECRET: {
    required: false,
    type: 'string'
  },
  CLIENT_URL: {
    required: false,
    type: 'string',
    default: 'http://localhost:3000'
  }
};

// Optional environment variables with defaults
const optionalEnvVars = {
  CORS_ORIGIN: {
    default: '*'
  },
  LOG_LEVEL: {
    values: ['error', 'warn', 'info', 'debug'],
    default: 'info'
  },
  SESSION_SECRET: {
    type: 'string',
    minLength: 32,
    default: () => generateRandomSecret()
  },
  RATE_LIMIT_WINDOW: {
    type: 'number',
    default: 15 * 60 * 1000 // 15 minutes
  },
  RATE_LIMIT_MAX: {
    type: 'number',
    default: 100
  }
};

// Validation functions
const validateString = (value, rules) => {
  if (rules.minLength && value.length < rules.minLength) {
    throw new Error(`${value} must be at least ${rules.minLength} characters long`);
  }
  
  if (rules.maxLength && value.length > rules.maxLength) {
    throw new Error(`${value} must be no more than ${rules.maxLength} characters long`);
  }
  
  if (rules.pattern && !rules.pattern.test(value)) {
    throw new Error(`${value} format is invalid`);
  }
  
  return value;
};

const validateNumber = (value, rules) => {
  const num = Number(value);
  
  if (isNaN(num)) {
    throw new Error(`${value} must be a valid number`);
  }
  
  if (rules.min !== undefined && num < rules.min) {
    throw new Error(`${value} must be at least ${rules.min}`);
  }
  
  if (rules.max !== undefined && num > rules.max) {
    throw new Error(`${value} must be no more than ${rules.max}`);
  }
  
  return num;
};

const generateRandomSecret = () => {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
};

// Validate environment variable
const validateEnvVar = (key, rules) => {
  const value = process.env[key];
  
  // Check if required and missing
  if (rules.required && !value) {
    throw new Error(`Required environment variable ${key} is missing`);
  }
  
  // Use default if available
  if (!value && rules.default !== undefined) {
    const defaultValue = typeof rules.default === 'function' ? rules.default() : rules.default;
    process.env[key] = defaultValue;
    return defaultValue;
  }
  
  if (!value) {
    return null;
  }
  
  // Type validation
  switch (rules.type) {
    case 'number':
      return validateNumber(value, rules);
    case 'string':
      return validateString(value, rules);
    default:
      return value;
  }
};

// Validate all environment variables
const validateEnvironment = () => {
  const errors = [];
  const warnings = [];
  
  // Validate required variables
  for (const [key, rules] of Object.entries(requiredEnvVars)) {
    try {
      validateEnvVar(key, rules);
    } catch (error) {
      errors.push(error.message);
    }
  }
  
  // Validate optional variables
  for (const [key, rules] of Object.entries(optionalEnvVars)) {
    try {
      if (process.env[key]) {
        validateEnvVar(key, { ...rules, required: false });
      } else if (rules.default !== undefined) {
        process.env[key] = typeof rules.default === 'function' ? rules.default() : rules.default;
      }
    } catch (error) {
      warnings.push(error.message);
    }
  }
  
  // Production-specific checks
  if (process.env.NODE_ENV === 'production') {
    const productionChecks = [
      {
        condition: process.env.JWT_SECRET === 'your_jwt_secret' || process.env.JWT_SECRET.length < 64,
        message: 'JWT_SECRET should be a strong, unique secret in production'
      },
      {
        condition: !process.env.MONGODB_URI || process.env.MONGODB_URI.includes('localhost'),
        message: 'Use a production MongoDB instance in production'
      },
      {
        condition: !process.env.EMAIL_USER || process.env.EMAIL_USER.includes('your_email'),
        message: 'Configure proper email settings in production'
      },
      {
        condition: !process.env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY.includes('your_stripe'),
        message: 'Configure Stripe with production keys in production'
      }
    ];
    
    productionChecks.forEach(check => {
      if (check.condition) {
        warnings.push(check.message);
      }
    });
  }
  
  // Development-specific checks
  if (process.env.NODE_ENV === 'development') {
    if (process.env.JWT_SECRET === 'your_jwt_secret') {
      warnings.push('Using default JWT_SECRET - please change this in production');
    }
  }
  
  return { errors, warnings };
};

// Get validated environment variables
const getValidatedEnv = () => {
  const env = {};
  
  // Combine all environment variable definitions
  const allEnvVars = { ...requiredEnvVars, ...optionalEnvVars };
  
  for (const [key, rules] of Object.entries(allEnvVars)) {
    env[key] = process.env[key];
  }
  
  return env;
};

// Print environment status
const printEnvironmentStatus = () => {
  console.log('\n' + '='.repeat(50));
  console.log('ENVIRONMENT VALIDATION');
  console.log('='.repeat(50));
  
  const { errors, warnings } = validateEnvironment();
  
  if (errors.length > 0) {
    console.log('\n\u274c ERRORS:');
    errors.forEach(error => console.log(`  - ${error}`));
    console.log('\nPlease fix these errors before starting the server.');
    process.exit(1);
  }
  
  console.log('\u2705 All required environment variables are valid');
  
  if (warnings.length > 0) {
    console.log('\n\u26a0\ufe0f WARNINGS:');
    warnings.forEach(warning => console.log(`  - ${warning}`));
  }
  
  console.log(`\ud83d\udccd Environment: ${process.env.NODE_ENV}`);
  console.log(`\ud83d\udd35 Port: ${process.env.PORT || 5000}`);
  console.log(`\ud83d\udd37 Database: ${process.env.MONGODB_URI ? 'Connected' : 'Not configured'}`);
  console.log('='.repeat(50) + '\n');
};

module.exports = {
  validateEnvironment,
  getValidatedEnv,
  printEnvironmentStatus,
  requiredEnvVars,
  optionalEnvVars
};
