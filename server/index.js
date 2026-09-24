require('dotenv').config(); // Must be first — loads .env before any process.env access

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize'); // 🛡️ NoSQL Injection Protection
const hpp = require('hpp');                               // 🛡️ HTTP Parameter Pollution Protection
const { v4: uuidv4 } = require('uuid');                  // 🔍 Request correlation IDs
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const { securityHeaders, validateInput, detectSuspiciousActivity } = require('./utils/security');
const { printEnvironmentStatus } = require('./utils/envValidator');
const { requestLogger, errorLogger } = require('./utils/errorLogger');
const logger = require('./utils/logger'); // 📝 Structured Winston Logger

// Validate environment variables
printEnvironmentStatus();

// ─── Validate Required Environment Variables ─────────────────────────────────
const requiredEnv = ['MONGODB_URI', 'JWT_SECRET'];
const missingEnv = requiredEnv.filter(key => !process.env[key]);
if (missingEnv.length > 0) {
  logger.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  logger.error('   Please check your .env file.');
  process.exit(1);
}

// ─── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'] }
});

// ─── Redis Scalability Setup (Optional) ──────────────────────────────────────
if (process.env.REDIS_URL) {
  const pubClient = createClient({ url: process.env.REDIS_URL });
  const subClient = pubClient.duplicate();

  Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
    io.adapter(createAdapter(pubClient, subClient));
    console.log('⚡ Redis adapter connected — Horizontal scaling enabled');
  }).catch(err => {
    console.warn('⚠️ Redis adapter failed to connect — Falling back to in-memory');
    console.error(err);
  });
} else {
  console.log('ℹ️ REDIS_URL not found — Using local in-memory socket adapter');
}

// ─── Security Middleware (applied once, with full config below) ───────────────

// Dev-only request logger — silenced in production
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📡 ${req.method} ${req.url} from ${req.headers.origin || 'direct'}`);
    next();
  });
}

// Production-ready CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  process.env.MOBILE_URL || 'http://localhost:3000',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000', // Development fallback
  'http://localhost:3001',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001'
];

// Remove duplicates in production
const uniqueOrigins = [...new Set(allowedOrigins)];

app.use(cors({
  origin: function (origin, callback) {
    if (process.env.NODE_ENV === 'production') {
      // In production: only allow configured frontend URL
      // Requests with no origin (curl, Postman) are blocked unless explicitly allowed
      if (!origin) {
        // Allow no-origin only in dev or from trusted server-side calls
        return callback(null, false);
      }
      if (origin === process.env.FRONTEND_URL) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked: ${origin} not in allowed origins`);
        callback(new Error('Not allowed by CORS'));
      }
    } else {
      // In development: allow no-origin requests (curl, Postman, mobile dev)
      if (!origin) return callback(null, true);
      if (uniqueOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`CORS blocked: ${origin} not in allowed origins`);
        callback(new Error('Not allowed by CORS'));
      }
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count']
}));

// HTTPS enforcement in production
if (process.env.NODE_ENV === 'production' && process.env.ENFORCE_HTTPS !== 'false') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      return res.redirect(301, `https://${req.header('host')}${req.url}`);
    }
    next();
  });
}

// Production-ready Helmet configuration
const helmetConfig = process.env.NODE_ENV === 'production' ? {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "res.cloudinary.com"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["'self'", "https://js.stripe.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      manifestSrc: ["'self'"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
} : {
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
};

app.use(helmet(helmetConfig));

// ─── Correlation ID Middleware ────────────────────────────────────────────────
// Attach a unique ID to every request for distributed tracing
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);
  next();
});

// Request logging middleware (before security for proper logging)
app.use(requestLogger);

// Security middleware
app.use(securityHeaders);

// 🛡️ NoSQL Injection Protection — strips $ and . from user input
// MUST be before validateInput and routes, but AFTER raw body routes (webhook)
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') return next(); // Exclude Stripe webhook
  mongoSanitize()(req, res, next);
});

// 🛡️ HTTP Parameter Pollution — prevents duplicate query params from overriding validation
app.use(hpp({
  whitelist: ['sort', 'fields', 'page', 'limit', 'status', 'category'] // Allow these to have multiple values
}));

// Input sanitization (XSS — applied after mongoSanitize)
app.use((req, res, next) => {
  if (req.path === '/api/payments/webhook') return next(); // Exclude webhook
  validateInput(req, res, next);
});

app.use(detectSuspiciousActivity);

// Error logging middleware (before error handler)
app.use(errorLogger);


// Production-ready rate limiting with per-user and per-IP tracking
const isDev = process.env.NODE_ENV === 'development' || !process.env.NODE_ENV;

// Enhanced rate limiter that tracks by IP and user ID
const createRateLimiter = (options) => {
  const limiter = rateLimit({
    windowMs: options.windowMs || 15 * 60 * 1000,
    max: options.max || 200,
    message: options.message || { message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if authenticated, otherwise IP
      if (req.user && req.user._id) {
        return `user:${req.user._id}`;
      }
      return req.ip; // Default standard IP string
    },
    validate: { keyGeneratorIpFallback: false },
    skip: (req) => {
      // Skip rate limiting for health checks
      return req.path === '/api/health' || req.path === '/health';
    }
  });
  return limiter;
};

// Different limits for different endpoints
const generalLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === 'test' ? 20 : (isDev ? 10000 : 200),
  message: { message: 'Too many requests, please try again later.' }
});

const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 10000 : 20,
  message: { message: 'Too many authentication attempts. Please try again later.' }
});

const strictLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: isDev ? 1000 : 10,
  message: { message: 'Rate limit exceeded. Please slow down.' }
});

// Apply rate limiting
app.use('/api/', generalLimiter);

// ─── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 🛡️ Security sanitation middlewares (applied after body parser)
app.use(mongoSanitize());
app.use(hpp());

// ─── Logging ─────────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

// ─── Make Socket.io available to controllers ──────────────────────────────────
app.set('io', io);

// Make io globally available for notifications
global.io = io;

// ─── Database Connection ──────────────────────────────────────────────────────
if (process.env.NODE_ENV !== 'test') {
  mongoose.connect(process.env.MONGODB_URI)
    .then(() => logger.info('✅ MongoDB Connected'))
    .catch(err => {
      logger.error('❌ MongoDB Connection Error:', err);
      process.exit(1);
    });
}

// ─── BullMQ Background Workers & Dashboard ──────────────────────────────────────
if (process.env.REDIS_URL) {
  const emailWorker = require('./workers/emailWorker');
  const { createBullBoard } = require('@bull-board/api');
  const { BullMQAdapter } = require('@bull-board/api/bullMQAdapter');
  const { ExpressAdapter } = require('@bull-board/express');
  const { emailQueue } = require('./config/queue');

  // Setup Bull-Board UI for Admin
  const serverAdapter = new ExpressAdapter();
  serverAdapter.setBasePath('/admin/queues');
  createBullBoard({
    queues: [new BullMQAdapter(emailQueue)],
    serverAdapter: serverAdapter,
  });

  app.use('/admin/queues', serverAdapter.getRouter());
  logger.info('📊 Bull-Board Queue UI available at /admin/queues');
} else {
  logger.info('ℹ️ REDIS_URL not set — BullMQ Background Workers and UI disabled (Memory Fallback Active)');
}

// ─── Routes ───────────────────────────────────────────────────────────────────
const authRoutes = require('./routes/auth');
const expertRoutes = require('./routes/experts');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');
const reviewRoutes = require('./routes/reviews');
const messageRoutes = require('./routes/messages');
const categoryRoutes = require('./routes/categories');
const companyRoutes = require('./routes/company');

app.use('/api/auth', authLimiter, authRoutes); // Strict rate limit on auth
app.use('/api/experts', expertRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/messages', messageRoutes); 
app.use('/api/chat', require('./routes/enhancedChat'));
app.use('/api/categories', categoryRoutes);
// ⚠️ Order matters: /api/company/bookings MUST be before /api/company
// otherwise Express matches /api/company first for all /api/company/* paths
app.use('/api/company/bookings', require('./routes/companyBookings'));
app.use('/api/company', companyRoutes);
app.use('/api/services', require('./routes/services'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/user', require('./routes/enhancedUser'));
app.use('/api/public', require('./routes/public'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/verification', require('./routes/verification'));
app.use('/api/meetings', require('./routes/meetings'));
app.use('/api/staff', require('./routes/staff'));

// ─── New Enterprise Feature Routes ────────────────────────────────────────────
app.use('/api/waitlist', require('./routes/waitlist'));
app.use('/api/invoices', require('./routes/invoices'));
app.use('/api/client-notes', require('./routes/clientNotes'));


// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ─── Socket.io Real-Time Events ───────────────────────────────────────────────
const Message = require('./models/Message');

io.on('connection', (socket) => {
  logger.info(`🔌 User connected: ${socket.id}`);

  // Expert subscribes to their room for live slot updates
  socket.on('join-expert-room', (expertId) => {
    socket.join(`expert-${expertId}`);
  });

  // User joins their personal notification room (for waitlist alerts, payment, etc.)
  socket.on('join-user-room', (userId) => {
    socket.join(`user-${userId}`);
  });

  // User joins a conversation-specific chat room
  socket.on('join-chat', (conversationId) => {
    socket.join(`chat-${conversationId}`);
  });

  // Send a message — save to DB and broadcast to room
  socket.on('send-message', async (data) => {
    const { conversationId, bookingId, senderId, recipientId, text } = data;
    try {
      const message = await Message.create({ conversationId, bookingId, senderId, recipientId, text });
      const populated = await message.populate('senderId', 'name avatar');
      io.to(`chat-${conversationId}`).emit('new-message', populated);
    } catch (err) {
      logger.error('💬 Chat error:', err);
      socket.emit('chat-error', { message: 'Failed to send message' });
    }
  });

  // Typing indicator
  socket.on('typing', ({ conversationId, userName }) => {
    socket.to(`chat-${conversationId}`).emit('user-typing', { userName });
  });

  socket.on('stop-typing', ({ conversationId }) => {
    socket.to(`chat-${conversationId}`).emit('user-stop-typing');
  });

  socket.on('disconnect', () => {
    logger.info(`🔌 User disconnected: ${socket.id}`);
  });
});

// ─── Static Assets (Production) ───────────────────────────────────────────────
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../web/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../web', 'dist', 'index.html'));
  });
}

// ─── Error Handling (MUST be last) ────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

// Export for testing
module.exports = app;

// ─── Start Server ─────────────────────────────────────────────────────────────
if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

// Handle unhandled rejections
process.on('unhandledRejection', (err) => {
  logger.error('💥 Unhandled Rejection:', err);
  server.close(() => process.exit(1));
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────
const shutdown = (signal) => {
  logger.info(`🛑 ${signal} received — gracefully shutting down...`);
  server.close(() => {
    logger.info('✅ HTTP server closed');
    // Close DB connection
    const mongoose = require('mongoose');
    mongoose.connection.close(false, () => {
      logger.info('✅ MongoDB connection closed');
      process.exit(0);
    });
  });

  // Force kill after 10s if graceful shutdown fails
  setTimeout(() => {
    logger.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// End of file restart trigger
