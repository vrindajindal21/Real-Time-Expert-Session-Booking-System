const express = require('express');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory database (for immediate testing)
let experts = [
  {
    _id: '1',
    name: 'Dr. Sarah Johnson',
    category: 'Technology',
    experience: 10,
    rating: 4.8,
    email: 'sarah.j@example.com',
    phone: '+1234567890',
    bio: 'Expert in React Native and mobile app development with over 10 years of experience.',
    timeSlots: [
      { date: '2024-02-23', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-23', startTime: '10:00', endTime: '11:00', isBooked: true },
      { date: '2024-02-23', startTime: '14:00', endTime: '15:00', isBooked: false },
      { date: '2024-02-24', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-24', startTime: '11:00', endTime: '12:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '2',
    name: 'Dr. Michael Chen',
    category: 'Healthcare',
    experience: 15,
    rating: 4.9,
    email: 'michael.c@example.com',
    phone: '+1234567891',
    bio: 'Specialized in healthcare technology and medical software development.',
    timeSlots: [
      { date: '2024-02-23', startTime: '11:00', endTime: '12:00', isBooked: false },
      { date: '2024-02-23', startTime: '15:00', endTime: '16:00', isBooked: false },
      { date: '2024-02-25', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-25', startTime: '14:00', endTime: '15:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '3',
    name: 'Prof. Emily Davis',
    category: 'Finance',
    experience: 12,
    rating: 4.7,
    email: 'emily.d@example.com',
    phone: '+1234567892',
    bio: 'Financial technology expert with expertise in blockchain and digital payments.',
    timeSlots: [
      { date: '2024-02-24', startTime: '10:00', endTime: '11:00', isBooked: false },
      { date: '2024-02-24', startTime: '13:00', endTime: '14:00', isBooked: false },
      { date: '2024-02-26', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-26', startTime: '14:00', endTime: '15:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '4',
    name: 'Dr. James Wilson',
    category: 'Education',
    experience: 8,
    rating: 4.6,
    email: 'james.w@example.com',
    phone: '+1234567893',
    bio: 'Educational technology specialist focusing on e-learning platforms.',
    timeSlots: [
      { date: '2024-02-23', startTime: '13:00', endTime: '14:00', isBooked: false },
      { date: '2024-02-23', startTime: '15:00', endTime: '16:00', isBooked: false },
      { date: '2024-02-25', startTime: '10:00', endTime: '11:00', isBooked: false },
      { date: '2024-02-25', startTime: '15:00', endTime: '16:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '5',
    name: 'Dr. Lisa Anderson',
    category: 'Consulting',
    experience: 20,
    rating: 4.9,
    email: 'lisa.a@example.com',
    phone: '+1234567894',
    bio: 'Business consulting expert with 20 years of experience in strategy and management.',
    timeSlots: [
      { date: '2024-02-24', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-24', startTime: '11:00', endTime: '12:00', isBooked: false },
      { date: '2024-02-26', startTime: '10:00', endTime: '11:00', isBooked: false },
      { date: '2024-02-26', startTime: '14:00', endTime: '15:00', isBooked: false },
      { date: '2024-02-27', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-27', startTime: '11:00', endTime: '12:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '6',
    name: 'Dr. Robert Taylor',
    category: 'Technology',
    experience: 12,
    rating: 4.5,
    email: 'robert.t@example.com',
    phone: '+1234567895',
    bio: 'Full-stack developer with expertise in cloud architecture and DevOps.',
    timeSlots: [
      { date: '2024-02-25', startTime: '14:00', endTime: '15:00', isBooked: false },
      { date: '2024-02-25', startTime: '16:00', endTime: '17:00', isBooked: false },
      { date: '2024-02-26', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-26', startTime: '11:00', endTime: '12:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '7',
    name: 'Dr. Maria Garcia',
    category: 'Healthcare',
    experience: 14,
    rating: 4.8,
    email: 'maria.g@example.com',
    phone: '+1234567896',
    bio: 'Medical professional with expertise in telemedicine and digital health solutions.',
    timeSlots: [
      { date: '2024-02-26', startTime: '14:00', endTime: '15:00', isBooked: false },
      { date: '2024-02-26', startTime: '16:00', endTime: '17:00', isBooked: false },
      { date: '2024-02-27', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-27', startTime: '11:00', endTime: '12:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '8',
    name: 'Prof. David Kim',
    category: 'Finance',
    experience: 16,
    rating: 4.9,
    email: 'david.k@example.com',
    phone: '+1234567897',
    bio: 'Investment banking expert with specialization in cryptocurrency and blockchain.',
    timeSlots: [
      { date: '2024-02-27', startTime: '10:00', endTime: '11:00', isBooked: false },
      { date: '2024-02-27', startTime: '14:00', endTime: '15:00', isBooked: false },
      { date: '2024-02-28', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-28', startTime: '11:00', endTime: '12:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '3',
    name: 'Prof. Emily Davis',
    category: 'Finance',
    experience: 12,
    rating: 4.7,
    email: 'emily.d@example.com',
    phone: '+1234567892',
    bio: 'Financial technology expert with expertise in blockchain and digital payments.',
    timeSlots: [
      { date: '2024-02-24', startTime: '10:00', endTime: '11:00', isBooked: false },
      { date: '2024-02-24', startTime: '13:00', endTime: '14:00', isBooked: false },
      { date: '2024-02-26', startTime: '09:00', endTime: '10:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '4',
    name: 'Dr. James Wilson',
    category: 'Education',
    experience: 8,
    rating: 4.6,
    email: 'james.w@example.com',
    phone: '+1234567893',
    bio: 'Educational technology specialist focusing on e-learning platforms.',
    timeSlots: [
      { date: '2024-02-23', startTime: '13:00', endTime: '14:00', isBooked: false },
      { date: '2024-02-25', startTime: '10:00', endTime: '11:00', isBooked: false },
      { date: '2024-02-25', startTime: '15:00', endTime: '16:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '5',
    name: 'Dr. Lisa Anderson',
    category: 'Consulting',
    experience: 20,
    rating: 4.9,
    email: 'lisa.a@example.com',
    phone: '+1234567894',
    bio: 'Business consulting expert with 20 years of experience in strategy and management.',
    timeSlots: [
      { date: '2024-02-24', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-24', startTime: '11:00', endTime: '12:00', isBooked: false },
      { date: '2024-02-26', startTime: '10:00', endTime: '11:00', isBooked: false },
      { date: '2024-02-26', startTime: '14:00', endTime: '15:00', isBooked: false },
    ],
    isActive: true
  }
];

let bookings = [];

// Routes
app.get('/api/experts', (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', category = '' } = req.query;
    
    let filteredExperts = [...experts];
    
    // Apply search filter
    if (search) {
      filteredExperts = filteredExperts.filter(expert => 
        expert.name.toLowerCase().includes(search.toLowerCase()) ||
        expert.bio.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    // Apply category filter
    if (category && category !== 'All') {
      filteredExperts = filteredExperts.filter(expert => 
        expert.category === category
      );
    }
    
    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedExperts = filteredExperts.slice(startIndex, endIndex);
    
    res.json({
      experts: paginatedExperts,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(filteredExperts.length / limit),
        total: filteredExperts.length,
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/experts/:id', (req, res) => {
  try {
    const expert = experts.find(e => e._id === req.params.id);
    if (!expert) {
      return res.status(404).json({ error: 'Expert not found' });
    }
    
    // Group time slots by date
    const groupedTimeSlots = {};
    expert.timeSlots.forEach(slot => {
      if (!groupedTimeSlots[slot.date]) {
        groupedTimeSlots[slot.date] = [];
      }
      groupedTimeSlots[slot.date].push(slot);
    });
    
    expert.groupedTimeSlots = groupedTimeSlots;
    res.json(expert);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/bookings', (req, res) => {
  try {
    const { expertId, customerName, customerEmail, customerPhone, date, startTime, endTime, notes } = req.body;
    
    // Validate required fields
    if (!expertId || !customerName || !customerEmail || !customerPhone || !date || !startTime || !endTime) {
      return res.status(400).json({ error: 'All required fields must be provided' });
    }
    
    // Check if slot is already booked
    const expert = experts.find(e => e._id === expertId);
    if (expert) {
      const slot = expert.timeSlots.find(s => 
        s.date === date && s.startTime === startTime && s.isBooked
      );
      if (slot) {
        return res.status(400).json({ error: 'Time slot is already booked' });
      }
    }
    
    // Create booking
    const newBooking = {
      _id: Date.now().toString(),
      expertId,
      customerName,
      customerEmail,
      customerPhone,
      date,
      startTime,
      endTime,
      notes: notes || '',
      status: 'Pending',
      bookingId: `BK${Date.now().toString().slice(-6)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    bookings.push(newBooking);
    
    // Mark time slot as booked
    if (expert) {
      const slot = expert.timeSlots.find(s => 
        s.date === date && s.startTime === startTime
      );
      if (slot) {
        slot.isBooked = true;
      }
    }
    
    // Emit real-time update
    io.emit(`slot-booked-${expertId}`, {
      expertId,
      date,
      startTime,
      slotId: `${date}-${startTime}`
    });
    
    res.status(201).json(newBooking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/bookings', (req, res) => {
  try {
    const { email } = req.query;
    
    if (!email) {
      return res.json([]);
    }
    
    const userBookings = bookings.filter(booking => 
      booking.customerEmail.toLowerCase() === email.toLowerCase()
    );
    
    // Add expert details to bookings
    const bookingsWithExperts = userBookings.map(booking => {
      const expert = experts.find(e => e._id === booking.expertId);
      return {
        ...booking,
        expert: expert ? {
          name: expert.name,
          email: expert.email,
          phone: expert.phone,
          category: expert.category
        } : null
      };
    });
    
    res.json(bookingsWithExperts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.patch('/api/bookings/:id/status', (req, res) => {
  try {
    const { status } = req.body;
    const booking = bookings.find(b => b._id === req.params.id);
    
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }
    
    booking.status = status;
    booking.updatedAt = new Date();
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join-expert-room', (expertId) => {
    socket.join(`expert-${expertId}`);
    console.log(`Client ${socket.id} joined expert room: ${expertId}`);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5002;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📱 Mobile app should connect to: http://localhost:${PORT}`);
  console.log(`🌐 Web app available at: http://localhost:${PORT}`);
});
