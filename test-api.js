// Simple API test script (without database)
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Mock data for testing
const mockExperts = [
  {
    _id: '1',
    name: 'Dr. Sarah Johnson',
    category: 'Healthcare',
    experience: 15,
    rating: 4.8,
    email: 'sarah.johnson@healthcare.com',
    phone: '+1234567890',
    bio: 'Experienced medical doctor specializing in internal medicine and preventive care.'
  },
  {
    _id: '2',
    name: 'John Smith',
    category: 'Technology',
    experience: 12,
    rating: 4.9,
    email: 'john.smith@tech.com',
    phone: '+1234567891',
    bio: 'Senior software engineer with expertise in cloud architecture and DevOps.'
  }
];

const mockBookings = [];

// API Routes
app.get('/api/experts', (req, res) => {
  const { search, category, page = 1, limit = 10 } = req.query;

  let filteredExperts = mockExperts;

  if (search) {
    filteredExperts = filteredExperts.filter(expert =>
      expert.name.toLowerCase().includes(search.toLowerCase())
    );
  }

  if (category && category !== 'all') {
    filteredExperts = filteredExperts.filter(expert =>
      expert.category === category
    );
  }

  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedExperts = filteredExperts.slice(startIndex, endIndex);

  res.json({
    experts: paginatedExperts,
    pagination: {
      current: parseInt(page),
      pages: Math.ceil(filteredExperts.length / limit),
      total: filteredExperts.length
    }
  });
});

app.get('/api/experts/:id', (req, res) => {
  const expert = mockExperts.find(e => e._id === req.params.id);

  if (!expert) {
    return res.status(404).json({ error: 'Expert not found' });
  }

  // Mock time slots
  const today = new Date();
  const groupedTimeSlots = {};

  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    const dateKey = currentDate.toISOString().split('T')[0];

    groupedTimeSlots[dateKey] = [];
    for (let hour = 9; hour < 18; hour++) {
      const startTime = `${hour.toString().padStart(2, '0')}:00`;

      // Check if this specific slot is already in our mockBookings and NOT cancelled
      const isBooked = mockBookings.some(b =>
        b.expertId === req.params.id &&
        b.date === dateKey &&
        b.startTime === startTime &&
        b.status !== 'Cancelled'
      );

      groupedTimeSlots[dateKey].push({
        _id: `${dateKey}-${hour}`,
        startTime,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        isBooked: isBooked
      });
    }
  }

  res.json({
    ...expert,
    groupedTimeSlots
  });
});

app.post('/api/bookings', (req, res) => {
  const { expertId, customerName, customerEmail, customerPhone, date, startTime, endTime, notes } = req.body;

  // Basic validation
  if (!expertId || !customerName || !customerEmail || !customerPhone || !date || !startTime || !endTime) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check for double booking (mock)
  const existingBooking = mockBookings.find(b =>
    b.expertId === expertId &&
    b.date === date &&
    b.startTime === startTime
  );

  if (existingBooking) {
    return res.status(409).json({ error: 'This time slot is already booked' });
  }

  const booking = {
    _id: Date.now().toString(),
    bookingId: `BK${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
    expertId,
    customerName,
    customerEmail,
    customerPhone,
    date,
    startTime,
    endTime,
    notes: notes || '',
    status: 'Pending',
    createdAt: new Date(),
    expertName: mockExperts.find(e => e._id === expertId)?.name || 'Unknown'
  };

  mockBookings.push(booking);

  res.status(201).json({
    message: 'Booking created successfully',
    booking
  });
});

app.get('/api/bookings', (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const bookings = mockBookings
    .filter(booking => booking.customerEmail.toLowerCase() === email.toLowerCase())
    .map(booking => ({
      ...booking,
      expertId: {
        ...mockExperts.find(e => e._id === booking.expertId),
        _id: booking.expertId
      }
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  res.json({ bookings });
});

app.patch('/api/bookings/:id/status', (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Pending', 'Confirmed', 'Completed', 'Cancelled'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  const booking = mockBookings.find(b => b._id === id);

  if (!booking) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  booking.status = status;

  res.json({
    message: 'Booking status updated successfully',
    booking
  });
});

app.delete('/api/bookings/:id', (req, res) => {
  const { id } = req.params;
  const index = mockBookings.findIndex(b => b._id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Booking not found' });
  }

  mockBookings.splice(index, 1);

  res.json({
    message: 'Booking deleted successfully'
  });
});

const path = require('path');

// Serve static assets
app.use(express.static(path.join(__dirname, 'mobile/dist')));

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.resolve(__dirname, 'mobile', 'dist', 'index.html'));
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Test API server running on http://localhost:${PORT}`);
  console.log('\n📱 Available endpoints:');
  console.log('GET  /api/experts - Get all experts');
  console.log('GET  /api/experts/:id - Get expert details');
  console.log('POST /api/bookings - Create booking');
  console.log('GET  /api/bookings?email= - Get bookings by email');
  console.log('PATCH /api/bookings/:id/status - Update booking status');
  console.log('\n🧪 Test with curl or Postman!');
});
