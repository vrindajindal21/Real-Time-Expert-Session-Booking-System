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
      throw new Error('MONGODB_URI is missing');
    }
    const db = await mongoose.connect(process.env.MONGODB_URI);
    isConnected = db.connections[0].readyState;
  } catch (err) {
    console.error('DB Error:', err);
    throw err;
  }
};

// Diagnostic Route
app.get('/api/test', (req, res) => {
  res.json({ status: 'ok', env: process.env.NODE_ENV, hasUri: !!process.env.MONGODB_URI });
});

// Experts Route with explicit error catching
app.get('/api/experts', async (req, res) => {
  try {
    await connectDB();
    const Expert = require('./models/Expert');
    const experts = await Expert.find({ isActive: true }).select('-timeSlots').limit(10);
    res.json({ experts, total: experts.length });
  } catch (err) {
    res.status(500).json({ error: 'Crash', message: err.message, stack: err.stack });
  }
});

// Serve static assets
app.use(express.static(path.join(__dirname, '../mobile/dist')));

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API route not found' });
  }
  res.sendFile(path.resolve(__dirname, '../mobile', 'dist', 'index.html'));
});

module.exports = app;
