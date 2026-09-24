const mongoose = require('mongoose');
const Expert = require('./models/Expert');
require('dotenv').config();

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const experts = await Expert.find({});
  console.log('Total Experts:', experts.length);
  console.log('Approved & Active Experts:', experts.filter(e => e.isApproved && e.isActive).length);
  if (experts.length > 0) {
    console.log('First Expert Example:', {
        name: experts[0].name,
        category: experts[0].category,
        isApproved: experts[0].isApproved,
        isActive: experts[0].isActive
    });
  }
  process.exit();
};
check();
