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

    // Generate dates for next 7 days
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
      {
        name: 'Dr. Sarah Johnson',
        category: 'Healthcare',
        experience: 15,
        rating: 4.8,
        email: 'sarah@expert.com',
        phone: '1234567890',
        bio: 'Specialist in telemedicine and mental health consultation with 15 years of clinical experience.',
        isActive: true,
        timeSlots: dates.flatMap(d => timeSlots(d))
      },
      {
        name: 'John Tech',
        category: 'Technology',
        experience: 12,
        rating: 4.9,
        email: 'john@tech.com',
        phone: '9876543210',
        bio: 'Full-stack architect and cloud specialist. Helping startups scale their technical infrastructure.',
        isActive: true,
        timeSlots: dates.flatMap(d => timeSlots(d))
      },
      {
        name: 'Prof. David Miller',
        category: 'Education',
        experience: 20,
        rating: 5.0,
        email: 'david@edu.com',
        phone: '5551234567',
        bio: 'University professor and educational consultant. Expert in curriculum design and student coaching.',
        isActive: true,
        timeSlots: dates.flatMap(d => timeSlots(d))
      },
      {
        name: 'Emily Chen',
        category: 'Finance',
        experience: 8,
        rating: 4.7,
        email: 'emily@finance.com',
        phone: '4449876543',
        bio: 'Investment advisor and certified financial planner. Passionate about helping individuals achieve financial freedom.',
        isActive: true,
        timeSlots: dates.flatMap(d => timeSlots(d))
      },
      {
        name: 'Marcus Thorne',
        category: 'Consulting',
        experience: 10,
        rating: 4.6,
        email: 'marcus@consulting.com',
        phone: '3335557777',
        bio: 'Business strategy consultant focusing on digital transformation and operational efficiency.',
        isActive: true,
        timeSlots: dates.flatMap(d => timeSlots(d))
      }
    ];

    await Expert.deleteMany({});
    await Expert.insertMany(sample);
    res.json({ message: 'Database populated with 5 diverse experts and 140+ time slots!', count: sample.length });
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
