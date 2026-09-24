const crypto = require('crypto');
const rateLimit = require('express-rate-limit');

// Security constants
const SECURITY = {
  ENCRYPTION_ALGORITHM: 'aes-256-gcm',
  KEY_LENGTH: 32,
  IV_LENGTH: 16,
  TAG_LENGTH: 16,
  SALT_LENGTH: 32,
  ITERATIONS: 100000
};

// Generate secure random token
exports.generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Generate password reset token
exports.generatePasswordResetToken = () => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return { token, hashedToken, expires };
};

// Verify password reset token
exports.verifyPasswordResetToken = (token, hashedToken, expires) => {
  const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
  return tokenHash === hashedToken && Date.now() < expires;
};

// Encrypt sensitive data (AES-256-GCM with proper IV usage)
exports.encrypt = (text, key) => {
  try {
    const iv = crypto.randomBytes(SECURITY.IV_LENGTH);
    // Derive a 32-byte key from the provided key string
    const keyBuffer = crypto.scryptSync(key, 'expert-booking-salt', SECURITY.KEY_LENGTH);
    const cipher = crypto.createCipheriv(SECURITY.ENCRYPTION_ALGORITHM, keyBuffer, iv);
    cipher.setAAD(Buffer.from('expert-booking', 'utf8'));
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    throw new Error('Encryption failed: ' + error.message);
  }
};

// Decrypt sensitive data
exports.decrypt = (encryptedData, key) => {
  try {
    const { encrypted, iv, tag } = encryptedData;
    const keyBuffer = crypto.scryptSync(key, 'expert-booking-salt', SECURITY.KEY_LENGTH);
    const decipher = crypto.createDecipheriv(SECURITY.ENCRYPTION_ALGORITHM, keyBuffer, Buffer.from(iv, 'hex'));
    decipher.setAAD(Buffer.from('expert-booking', 'utf8'));
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    throw new Error('Decryption failed: ' + error.message);
  }
};

// Generate API key
exports.generateApiKey = () => {
  const prefix = 'exp_';
  const randomPart = crypto.randomBytes(24).toString('hex');
  return prefix + randomPart;
};

// Hash API key
exports.hashApiKey = (apiKey) => {
  return crypto.createHash('sha256').update(apiKey).digest('hex');
};

// Verify API key
exports.verifyApiKey = (apiKey, hashedKey) => {
  const hashed = crypto.createHash('sha256').update(apiKey).digest('hex');
  return hashed === hashedKey;
};

// Sanitize HTML to prevent XSS
exports.sanitizeHtml = (html) => {
  if (!html) return '';
  
  // Basic HTML sanitization - in production, use a library like DOMPurify
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return html.replace(/[&<>"']/g, (m) => map[m]);
};

// Validate and sanitize user input
exports.sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove scripts
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '') // Remove iframes
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, ''); // Remove event handlers
};

// Rate limiting configurations
exports.rateLimitConfigs = {
  // Strict rate limiting for auth endpoints
  auth: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per window
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
  }),
  
  // General API rate limiting
  api: rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per window
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  }),
  
  // File upload rate limiting
  upload: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10, // 10 uploads per minute
    message: 'Too many file uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  }),
  
  // Search rate limiting
  search: rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: 'Too many search requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false
  })
};

// CSRF protection
exports.generateCSRFToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Content Security Policy
exports.cspPolicy = {
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    fontSrc: ["'self'", "https://fonts.gstatic.com"],
    imgSrc: ["'self'", "data:", "https:", "blob:"],
    scriptSrc: ["'self'"],
    connectSrc: ["'self'", "https://api.stripe.com", "wss:"],
    frameSrc: ["'none'"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    manifestSrc: ["'self'"]
  }
};

// Security headers middleware
exports.securityHeaders = (req, res, next) => {
  // Prevent XSS attacks
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Prevent clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Force HTTPS (in production)
  if (process.env.NODE_ENV === 'production') {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  }
  
  // Content Security Policy
  const csp = Object.entries(exports.cspPolicy.directives)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
  res.setHeader('Content-Security-Policy', csp);
  
  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  next();
};

// Input validation middleware
exports.validateInput = (req, res, next) => {
  // Sanitize request body
  if (req.body) {
    req.body = exports.sanitizeObject(req.body);
  }
  
  // Sanitize query parameters
  if (req.query) {
    req.query = exports.sanitizeObject(req.query);
  }
  
  next();
};

// Recursively sanitize object
exports.sanitizeObject = (obj) => {
  if (typeof obj !== 'object' || obj === null) {
    return typeof obj === 'string' ? exports.sanitizeInput(obj) : obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => exports.sanitizeObject(item));
  }
  
  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'experience') {
      sanitized[key] = Number(value) || 0;
    } else {
      sanitized[key] = exports.sanitizeObject(value);
    }
  }
  
  return sanitized;
};

// Password strength validation
exports.validatePasswordStrength = (password) => {
  const checks = {
    length: password.length >= 8,
    lowercase: /[a-z]/.test(password),
    uppercase: /[A-Z]/.test(password),
    numbers: /\d/.test(password),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
  };
  
  const score = Object.values(checks).filter(Boolean).length;
  
  return {
    score,
    strength: score <= 2 ? 'weak' : score <= 3 ? 'medium' : 'strong',
    checks
  };
};

// Generate secure session ID
exports.generateSessionId = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Validate file upload
exports.validateFileUpload = (file, allowedTypes = [], maxSize = 10 * 1024 * 1024) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: 'File size too large' };
  }
  
  if (allowedTypes.length > 0 && !allowedTypes.includes(file.mimetype)) {
    return { valid: false, error: 'File type not allowed' };
  }
  
  return { valid: true };
};

// Detect suspicious activity
exports.detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /eval\(/i,
    /exec\(/i
  ];
  
  const checkString = (str) => {
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };
  
  // Check various request properties
  const suspicious = [
    req.url && checkString(req.url),
    req.headers['user-agent'] && checkString(req.headers['user-agent']),
    req.headers.referer && checkString(req.headers.referer)
  ].filter(Boolean);
  
  if (suspicious.length > 0) {
    console.warn('Suspicious activity detected:', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      url: req.url,
      patterns: suspicious
    });
    
    // In production, you might want to block the request
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({
        success: false,
        message: 'Request blocked due to suspicious activity'
      });
    }
  }
  
  next();
};
