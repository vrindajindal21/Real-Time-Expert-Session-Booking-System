require('dotenv').config();
const mongoose = require('mongoose');
const Expert = require('../models/Expert');
const User = require('../models/User');

async function testMongoose() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected');
  
  const user = await User.findOne({ email: 'admin@bookinghub.com' });
  console.log('User found:', user._id);
  
  try {
      const expert = await Expert.create({
        userId: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone || '0000000000',
        experience: 0,
        rating: 0,
        category: 'Other',
        companyName: '',
        providerType: 'Individual',
        bio: 'Welcome to our professional network.',
        isApproved: true,
        isActive: true,
        services: [
          { title: 'Introductory Session', price: 0, duration: 30, description: 'Initial consultation', type: 'Session' }
        ],
        timeSlots: []
      });
      console.log('Successfully auto-healed!', expert._id);
  } catch(e) {
      console.error('Failed to create expert:', e.message);
  }
  process.exit();
}
testMongoose();
