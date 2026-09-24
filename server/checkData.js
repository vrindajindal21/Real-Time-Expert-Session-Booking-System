const mongoose = require('mongoose');
const Category = require('./models/Category');
require('dotenv').config();

const check = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  const categories = await Category.find({});
  console.log('Categories in DB:', categories);
  process.exit();
};
check();
