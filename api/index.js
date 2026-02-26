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

// Mock Socket.io for Vercel (avoids crash in controllers)
const mockIo = {
  to: () => ({ emit: () => { } }),
  emit: () => { }
};
app.set('io', mockIo);

// MongoDB Connection
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is missing');

    // Set a very short timeout so you get an error message instead of a long hang
    const db = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = db.connections[0].readyState;
  } catch (err) {
    console.error('DB Connection Error:', err.message);
    throw err;
  }
};

// Help Route - See this in your browser
app.get('/api/status', async (req, res) => {
  try {
    await connectDB();
    res.json({
      status: 'Connected',
      database: 'OK',
      env: process.env.NODE_ENV,
      hasUri: !!process.env.MONGODB_URI,
      info: 'If experts are missing, go to /api/seed'
    });
  } catch (err) {
    res.json({
      status: 'Connection Failed',
      error: err.message,
      fix: 'Atlas Network Access -> Add 0.0.0.0/0'
    });
  }
});

// Seed Route
app.get('/api/seed', async (req, res) => {
  try {
    await connectDB();
    const Expert = require('./models/Expert');
    const sample = [
      { name: 'Dr. Sarah Johnson', category: 'Healthcare', experience: 15, rating: 4.8, email: 'sarah@expert.com', phone: '123', bio: 'Expert', isActive: true },
      { name: 'John Tech', category: 'Technology', experience: 12, rating: 4.9, email: 'john@tech.com', phone: '456', bio: 'Expert', isActive: true }
    ];
    await Expert.deleteMany({});
    await Expert.insertMany(sample);
    res.json({ message: 'Database populated!', count: sample.length });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed', message: err.message });
  }
});

// Real Routes
const expertsRoute = require('./routes/experts');
const bookingsRoute = require('./routes/bookings');

app.use('/api/experts', async (req, res, next) => {
  try { await connectDB(); next(); }
  catch (err) { res.status(500).json({ error: 'DB_DOWN', message: err.message }); }
}, expertsRoute);

app.use('/api/bookings', async (req, res, next) => {
  try { await connectDB(); next(); }
  catch (err) { res.status(500).json({ error: 'DB_DOWN', message: err.message }); }
}, bookingsRoute);

// Catch-all 404 handler for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Not Found', path: req.originalUrl });
});

// For compatibility with local/different rewrite styles
app.use((req, res, next) => {
  if (req.url.startsWith('/api')) return next();
  res.status(404).json({ error: 'Not Found', message: 'Unknown Route' });
});

module.exports = app;
