const mongoose = require('mongoose');
const Category = require('./models/Category');
const Expert = require('./models/Expert');
const User = require('./models/User');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const experts = [
  {
    name: 'Dr. Sarah Wilson',
    category: 'Healthcare',
    sessionType: 'Both',
    location: 'Mumbai, India',
    experience: 12,
    rating: 4.9,
    email: 'sarah.wilson@demo.com',
    phone: '9876543210',
    bio: 'Specialist Dermatologist with 12+ years of experience in clinical and cosmetic treatments. Offering both online consultations and clinic visits.',
    services: [
      { title: 'Standard Consultation', price: 1500, duration: 30, type: 'Session' },
      { title: 'Full Treatment Plan', price: 5000, duration: 60, type: 'Package' }
    ],
    customFields: new Map([['Specialization', 'Clinical Dermatology'], ['Degree', 'MD, MBBS']])
  },
  {
    name: 'Prof. James Chen',
    category: 'Education',
    sessionType: 'Online',
    experience: 8,
    rating: 5.0,
    email: 'james.chen@demo.com',
    phone: '9876543211',
    bio: 'Award-winning Mathematics professor. Specialized in Advanced Calculus and competitive exam preparation for university students.',
    services: [
      { title: 'Calculus Session', price: 1200, duration: 45, type: 'Session' },
      { title: 'Exam Prep (5 Sessions)', price: 5000, duration: 45, type: 'Package' }
    ],
    customFields: new Map([['Subject', 'Mathematics'], ['Level', 'University / Masters']])
  },
  {
    name: 'David Miller',
    category: 'Consulting',
    sessionType: 'Both',
    location: 'Bangalore, India',
    experience: 15,
    rating: 4.9,
    email: 'david.miller@demo.com',
    phone: '9876543212',
    bio: 'Former Fortune 500 HR Director. Helping startups scale their teams and culture. Specialized in executive growth and leadership mentoring.',
    services: [
      { title: 'Career Strategy', price: 3000, duration: 45, type: 'Session' },
      { title: 'Leadership Coaching (Monthly)', price: 15000, duration: 60, type: 'Subscription' }
    ],
    customFields: new Map([['Expertise', 'Startup Scaling'], ['Focus', 'Leadership & HR']])
  }
];

const seedFullMarketplace = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('Connected to Database...');
  
      // 1. CLEAR COLLECTIONS
      await Category.deleteMany({});
      await Expert.deleteMany({});
      await User.deleteMany({ role: { $ne: 'admin' } }); // Clear demo experts but keep admins
      console.log('🗑️ Collections Cleared!');
  
      // 2. SEED CATEGORIES
      const categoryList = [
        { name: 'Healthcare', icon: 'Stethoscope' },
        { name: 'Education', icon: 'BookOpen' },
        { name: 'Consulting', icon: 'Briefcase' },
        { name: 'Events', icon: 'Calendar' },
        { name: 'Home Services', icon: 'Home' },
        { name: 'Fitness', icon: 'Activity' },
        { name: 'Corporate', icon: 'Building' },
        { name: 'Travel', icon: 'Globe' },
        { name: 'Other', icon: 'Plus' }
      ];
      await Category.insertMany(categoryList);
      console.log('✅ Categories Created!');
  
      // 3. SEED EXPERTS
      for (const e of experts) {
        // Create user for each expert first
        // Pass RAW password 'DemoPass123' - The User model's pre-save hook will hash it automatically.
        const user = await User.create({
          name: e.name,
          email: e.email,
          password: 'DemoPass123', 
          role: 'expert'
        });
        
        // Create expert profile
        await Expert.create({
          ...e,
          userId: user._id,
          isApproved: true,
          isActive: true,
          timeSlots: [
              { date: new Date(), startTime: '10:00 AM', endTime: '10:30 AM', isBooked: false },
              { date: new Date(), startTime: '11:00 AM', endTime: '11:30 AM', isBooked: false },
              { date: new Date(), startTime: '02:00 PM', endTime: '02:30 PM', isBooked: false }
          ]
        });
      }
      console.log('✅ Featured Experts Created!');
  
      process.exit();
    } catch (err) {
      console.error('❌ Error during seeding:', err);
      process.exit(1);
    }
  };
  
  seedFullMarketplace();


  
