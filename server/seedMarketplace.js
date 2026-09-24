const mongoose = require('mongoose');
const Category = require('./models/Category');
const Expert = require('./models/Expert');
require('dotenv').config();

const categories = [
  { name: 'Healthcare', icon: 'Stethoscope', description: 'Doctors, Specialists, and Wellness Coaches' },
  { name: 'Education', icon: 'BookOpen', description: 'Academic Tutors and Skill Mentors' },
  { name: 'Consulting', icon: 'Briefcase', description: 'Startup Mentors and Career Coaches' },
  { name: 'Fitness', icon: 'Activity', description: 'Yoga Masters and Personal Trainers' },
  { name: 'Finance', icon: 'PieChart', description: 'Investment Advisors and Tax Accountants' },
  { name: 'Technology', icon: 'Code', description: 'Software Architects and Tech Support' }
];

const seedMarketplace = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to Database...');

    // 1. Seed Categories
    await Category.deleteMany({});
    await Category.insertMany(categories);
    console.log('✅ Categories Seeded!');

    // 2. Approve all Experts (for testing)
    await Expert.updateMany({}, { isApproved: true });
    console.log('✅ All Experts Approved!');

    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedMarketplace();
