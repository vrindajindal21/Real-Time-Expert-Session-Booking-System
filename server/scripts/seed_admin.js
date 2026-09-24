require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    const adminEmail = 'admin@bookinghub.com';
    const adminPassword = 'adminpassword';
    
    let admin = await User.findOne({ email: adminEmail });
    if (admin) {
      admin.role = 'admin';
      admin.password = await bcrypt.hash(adminPassword, 12);
      await admin.save();
      console.log('Admin already existed. Reset password and enforced admin role.');
    } else {
      admin = new User({
        name: 'System Admin',
        email: adminEmail,
        password: adminPassword, // Will be hashed via pre-save hook
        role: 'admin'
      });
      await admin.save();
      console.log('Created new Admin account.');
    }
    
    console.log('\n--- ADMIN CREDENTIALS ---');
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log('-------------------------\n');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createAdmin();
