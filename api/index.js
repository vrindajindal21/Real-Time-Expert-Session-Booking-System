const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection logic for serverless
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI is missing from environment variables.');
    }
    console.log('Attempting to connect to MongoDB...');
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds if DB is unreachable
    });
    isConnected = db.connections[0].readyState;
    console.log('Connected to MongoDB');
  } catch (err) {
    console.error('DB Connection Error:', err);
    throw err;
  }
};

// Diagnostic Route
app.get('/api/test', (req, res) => {
  res.json({
    status: 'ok',
    env: process.env.NODE_ENV,
    hasUri: !!process.env.MONGODB_URI,
    uriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0
  });
});

// Production Seed Route
app.get('/api/seed', async (req, res) => {
  try {
    await connectDB();
    const Expert = require('./models/Expert');
    const sampleExperts = [
      {
        name: 'Dr. Sarah Johnson',
        category: 'Healthcare',
        experience: 15,
        rating: 4.8,
        email: 'sarah.johnson@healthcare.com',
        phone: '+1234567890',
        bio: 'Experienced medical doctor specializing in internal medicine and preventive care.',
        timeSlots: [],
        isActive: true
      },
      {
        name: 'John Smith',
        category: 'Technology',
        experience: 12,
        rating: 4.9,
        email: 'john.smith@tech.com',
        phone: '+1234567891',
        bio: 'Senior software engineer with expertise in cloud architecture and DevOps.',
        timeSlots: [],
        isActive: true
      }
    ];
    await Expert.deleteMany({});
    await Expert.insertMany(sampleExperts);
    res.json({ success: true, message: 'Database seeded successfully with experts!' });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed', message: err.message });
  }
});

// Import Routes
const expertRoutes = require('./routes/experts');
const bookingRoutes = require('./routes/bookings');

// Use DB Connection middleware for API
app.use('/api', async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    res.status(500).json({
      error: 'Database connection failed',
      message: err.message,
      stack: err.stack, // SHOW STACK IN PROD FOR DIAGNOSIS
      hint: 'Check your MONGODB_URI password and IP whitelist in Atlas.'
    });
  }
});

// Mount Routes
app.use('/api/experts', expertRoutes);
app.use('/api/bookings', bookingRoutes);

// Serve static assets
app.use(express.static(path.join(__dirname, '../mobile/dist')));

app.get('*', (req, res) => {
  // If it's an API route that didn't match above, return 404
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Otherwise serve the mobile web app
  res.sendFile(path.resolve(__dirname, '../mobile', 'dist', 'index.html'));
});

module.exports = app;
