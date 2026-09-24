const mongoose = require('mongoose');
const User = require('./models/User');
const Expert = require('./models/Expert');
require('dotenv').config();

const clearAuthData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Database...');

    // Delete all users except admin (if you want to keep admin)
    // Or just delete everything for a total reset
    await User.deleteMany({});
    await Expert.deleteMany({});
    
    console.log('🗑️ All login data (Users & Experts) has been cleared from the database.');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

clearAuthData();
