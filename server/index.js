const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

dotenv.config();

const app = express();
const server = http.createServer(app);
let io;

// Only initialize Socket.io if not on Vercel OR if explicitly enabled
if (process.env.NODE_ENV !== 'production' || process.env.ENABLE_SOCKET === 'true') {
  io = socketIo(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);
    socket.on('join-expert-room', (expertId) => {
      socket.join(`expert-${expertId}`);
    });
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  app.set('io', io);
}

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection logic for serverless
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState;
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err);
    throw err;
  }
};

// Middleware to ensure DB connection
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api')) {
    try {
      await connectDB();
      next();
    } catch (err) {
      return res.status(500).json({
        error: 'Database connection failed',
        message: err.message,
        tip: 'Check your MONGODB_URI environment variable and IP whitelist in Atlas.'
      });
    }
  } else {
    next();
  }
});

// Routes
app.use('/api/experts', require('./routes/experts'));
app.use('/api/bookings', require('./routes/bookings'));

// Diagnostic Seed Route (One-time setup)
app.get('/api/debug/seed', async (req, res) => {
  try {
    const Expert = require('./models/Expert');
    const sampleData = [
      {
        name: 'Dr. Sarah Johnson',
        category: 'Healthcare',
        experience: 15,
        rating: 4.8,
        email: 'sarah.johnson.prod@expert.com',
        phone: '+1234567890',
        bio: 'Production Expert: Internal medicine specialist.',
        isActive: true
      },
      {
        name: 'Tech Lead John',
        category: 'Technology',
        experience: 12,
        rating: 4.9,
        email: 'john.tech.prod@expert.com',
        phone: '+1234567891',
        bio: 'Production Expert: Cloud architect.',
        isActive: true
      }
    ];
    await Expert.deleteMany({});
    await Expert.insertMany(sampleData);
    res.json({ message: 'Database seeded successfully with 2 experts!' });
  } catch (err) {
    res.status(500).json({ error: 'Seeding failed', message: err.message });
  }
});

// Serve static assets in production
app.use(express.static(path.join(__dirname, '../mobile/dist')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.resolve(__dirname, '../mobile', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5001;

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
