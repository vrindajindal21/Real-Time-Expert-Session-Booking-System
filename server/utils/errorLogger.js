/**
 * Centralized Error Logging Middleware
 * Production-ready error tracking with structured logging
 */

const fs = require('fs');
const path = require('path');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const errorLogFile = path.join(logsDir, 'errors.log');
const accessLogFile = path.join(logsDir, 'access.log');

// Write to log file with rotation
const writeLog = (filePath, logEntry) => {
  try {
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${logEntry}\n`;
    
    // Simple log rotation (keep last 1MB)
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      if (stats.size > 1024 * 1024) { // 1MB
        const backupPath = filePath.replace('.log', '.old.log');
        fs.renameSync(filePath, backupPath);
      }
    }
    
    fs.appendFileSync(filePath, logLine);
  } catch (error) {
    console.error('Failed to write to log file:', error);
  }
};

// Request logger middleware
const requestLogger = (req, res, next) => {
  const startTime = Date.now();
  
  // Log request
  const requestLog = {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user._id : null,
    timestamp: new Date().toISOString()
  };
  
  // Capture response
  const originalSend = res.send;
  res.send = function(data) {
    res.send = originalSend;
    res.send(data);
    
    const duration = Date.now() - startTime;
    const responseLog = {
      ...requestLog,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      contentLength: res.get('Content-Length') || 0
    };
    
    // Log access in production
    if (process.env.NODE_ENV === 'production') {
      writeLog(accessLogFile, JSON.stringify(responseLog));
    } else {
      console.log(`ACCESS: ${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    }
  };
  
  next();
};

// Error logger middleware
const errorLogger = (err, req, res, next) => {
  // Strip sensitive data before logging — GDPR compliance
  const SENSITIVE_FIELDS = ['password', 'token', 'secret', 'cardNumber', 'cvv', 'ssn', 'pin', 'otp'];
  const sanitizeForLog = (obj) => {
    if (!obj || typeof obj !== 'object') return obj;
    const cleaned = { ...obj };
    SENSITIVE_FIELDS.forEach(field => {
      if (cleaned[field]) cleaned[field] = '[REDACTED]';
    });
    return cleaned;
  };

  const errorLog = {
    requestId: req.requestId,
    message: err.message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user ? req.user._id : null,
    body: sanitizeForLog(req.body),
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  };
  
  // Log error details
  if (process.env.NODE_ENV === 'production') {
    writeLog(errorLogFile, JSON.stringify(errorLog));
    
    // Send to external logging service (Sentry, etc.) if configured
    if (process.env.SENTRY_DSN) {
      // Integration point for Sentry or similar service
      console.log('ERROR LOGGED FOR EXTERNAL SERVICE:', errorLog.message);
    }
  } else {
    console.error('ERROR:', errorLog);
  }
  
  next(err);
};

// Crash handler
const setupCrashHandlers = () => {
  const crashLog = (error, origin) => {
    const logEntry = {
      message: error.message,
      stack: error.stack,
      origin: origin,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    };
    
    writeLog(errorLogFile, `CRASH: ${JSON.stringify(logEntry)}`);
  };
  
  process.on('uncaughtException', (error) => {
    crashLog(error, 'uncaughtException');
    console.error('Uncaught Exception:', error);
    process.exit(1);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    crashLog(reason, 'unhandledRejection');
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
  });
};

// Initialize crash handlers
setupCrashHandlers();

module.exports = {
  requestLogger,
  errorLogger,
  writeLog
};
