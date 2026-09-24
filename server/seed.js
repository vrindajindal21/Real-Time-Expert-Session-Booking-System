const mongoose = require('mongoose');
const Expert = require('./models/Expert');
const User = require('./models/User');
const Booking = require('./models/Booking');
const Review = require('./models/Review');
const Message = require('./models/Message');
require('dotenv').config();

const expertsData = [
  {
    name: 'Dr. Sarah Johnson',
    category: 'Healthcare',
    experience: 15,
    email: 'doctor@example.com',
    password: 'password123',
    bio: 'Experienced medical doctor specializing in internal medicine.',
    phone: '+1234567890'
  },
  {
    name: 'John Smith',
    category: 'Consulting',
    experience: 12,
    email: 'tech@example.com',
    password: 'password123',
    bio: 'Senior software engineer and cloud architect.',
    phone: '+1234567891'
  },
  {
    name: 'Emily Chen',
    category: 'Consulting',
    experience: 10,
    email: 'finance@example.com',
    password: 'password123',
    bio: 'Certified financial planner and investment strategist.',
    phone: '+1234567892'
  }
];

const consumersData = [
  { name: 'Alice Consumer', email: 'user@example.com', password: 'password123', role: 'user' },
  { name: 'Bob Student', email: 'student@example.com', password: 'password123', role: 'user' }
];

const adminData = {
  name: 'Super Admin',
  email: 'admin@example.com',
  password: 'adminpassword',
  role: 'admin'
};

function generateTimeSlots() {
  const slots = [];
  const today = new Date();
  for (let day = 0; day < 5; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    for (let hour = 9; hour < 17; hour++) {
      slots.push({
        date: new Date(currentDate),
        startTime: `${hour.toString().padStart(2, '0')}:00`,
        endTime: `${(hour + 1).toString().padStart(2, '0')}:00`,
        isBooked: false
      });
    }
  }
  return slots;
}

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear everything
    await User.deleteMany({});
    await Expert.deleteMany({});
    await Booking.deleteMany({});
    await Review.deleteMany({});
    await Message.deleteMany({});
    console.log('Database cleared');

    // 1. Create Admin
    await User.create(adminData);
    console.log('Admin account created: admin@example.com');

    // 2. Create Consumers (use create() one-by-one so the pre-save password hash hook fires)
    for (const consumer of consumersData) {
      await User.create(consumer);
    }
    console.log('Consumer accounts created');

    // 3. Create Experts and their User links
    for (const exp of expertsData) {
      // Create user account first
      const user = await User.create({
        name: exp.name,
        email: exp.email,
        password: exp.password,
        role: 'expert'
      });

      // Create expert profile linked to user
      await Expert.create({
        name: exp.name,
        category: exp.category,
        experience: exp.experience,
        email: exp.email,
        phone: exp.phone,
        bio: exp.bio,
        userId: user._id,
        isApproved: true, // Pre-approve for testing
        services: [
          { title: `${exp.category} Consultation`, price: 150, duration: 60 },
          { title: `Expert Strategy Session`, price: 299, duration: 90 }
        ],
        timeSlots: generateTimeSlots()
      });
    }
    console.log('Expert profiles and accounts created');

    console.log('-------------------------------------------');
    console.log('SEEDING COMPLETE! Use these credentials:');
    console.log('DOCTOR: doctor@example.com / password123');
    console.log('USER: user@example.com / password123');
    console.log('ADMIN: admin@example.com / adminpassword');
    console.log('-------------------------------------------');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
