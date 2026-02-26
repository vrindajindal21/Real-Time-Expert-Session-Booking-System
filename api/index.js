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

// Categories Route - Dynamic List for Frontend
app.get('/api/categories', async (req, res) => {
  try {
    await connectDB();
    const Expert = require('./models/Expert');
    const categories = await Expert.distinct('category', { isActive: true });
    res.json({ categories: ['All', ...categories] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Seed Route (Expanded for Universal Mode)
app.get('/api/seed', async (req, res) => {
  try {
    await connectDB();
    const Expert = require('./models/Expert');
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      d.setHours(0, 0, 0, 0);
      dates.push(d);
    }
    const timeSlots = (date) => [
      { date, startTime: '09:00', endTime: '10:00', isBooked: false },
      { date, startTime: '11:00', endTime: '12:00', isBooked: false },
      { date, startTime: '14:00', endTime: '15:00', isBooked: false },
      { date, startTime: '16:00', endTime: '17:00', isBooked: false }
    ];

    const sample = [
      { name: 'Dr. Sarah Smith', category: 'Healthcare', resourceType: 'Person', companyName: 'City Hospital', email: 'doc@city.com', phone: '1', bio: 'Healthcare Specialist', timeSlots: dates.flatMap(d => timeSlots(d)) },
      { name: 'John Tech', category: 'Technology', resourceType: 'Person', companyName: 'CodeWiz Inc', email: 'john@tech.com', phone: '2', bio: 'Cloud Architect', timeSlots: dates.flatMap(d => timeSlots(d)) },
      { name: 'Finance Pro', category: 'Finance', resourceType: 'Person', companyName: 'Wealth Management', email: 'investor@fin.com', phone: '3', bio: 'Investment Advisor', timeSlots: dates.flatMap(d => timeSlots(d)) },
      { name: 'Prof. Miller', category: 'Education', resourceType: 'Person', companyName: 'Global Edu', email: 'miller@edu.com', phone: '4', bio: 'Certified Tutor', timeSlots: dates.flatMap(d => timeSlots(d)) },
      { name: 'Strategic Consult', category: 'Consulting', resourceType: 'Service', companyName: 'BizPros', email: 'biz@consult.com', phone: '5', bio: 'Strategy Consultant', timeSlots: dates.flatMap(d => timeSlots(d)) },
      { name: 'Miscellaneous SVC', category: 'Other', resourceType: 'Service', companyName: 'General Svcs', email: 'svcs@other.com', phone: '6', bio: 'General Service Provider', timeSlots: dates.flatMap(d => timeSlots(d)) }
    ];
    await Expert.deleteMany({});
    await Expert.insertMany(sample);
    res.json({ message: 'Database seeded with your requested categories!', count: sample.length });
  } catch (err) {
    res.status(500).json({ error: 'Seed failed', message: err.message });
  }
});

// Create Resource Route
app.post('/api/experts', async (req, res) => {
  try {
    await connectDB();
    const Expert = require('./models/Expert');
    const newResource = new Expert(req.body);
    await newResource.save();
    res.status(201).json({ message: 'Resource created!', data: newResource });
  } catch (err) {
    res.status(500).json({ error: 'Create failed', message: err.message });
  }
});

// Delete Resource Route
app.delete('/api/experts/:id', async (req, res) => {
  try {
    await connectDB();
    const Expert = require('./models/Expert');
    await Expert.findByIdAndDelete(req.params.id);
    res.json({ message: 'Resource deleted!' });
  } catch (err) {
    res.status(500).json({ error: 'Delete failed', message: err.message });
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
