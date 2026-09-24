require('dotenv').config();
const mongoose = require('mongoose');

async function dropIndexes() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to DB');
    
    // Drop indexes on the staffs collection
    await mongoose.connection.collection('staffs').dropIndexes();
    console.log('Successfully dropped staffs collection indexes');
    
    // Also drop indexes on bookings, companies, users to clear any other warnings
    try {
      await mongoose.connection.collection('bookings').dropIndexes();
      console.log('Successfully dropped bookings collection indexes');
    } catch(e) {}
    
    try {
      await mongoose.connection.collection('users').dropIndexes();
      console.log('Successfully dropped users collection indexes');
    } catch(e) {}

    try {
      await mongoose.connection.collection('companies').dropIndexes();
      console.log('Successfully dropped companies collection indexes');
    } catch(e) {}
    
    console.log('Done!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndexes();
