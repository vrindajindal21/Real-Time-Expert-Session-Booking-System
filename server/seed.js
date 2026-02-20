const mongoose = require('mongoose');
const Expert = require('./models/Expert');
require('dotenv').config({ path: '../.env' });

// Sample expert data
const sampleExperts = [
  {
    name: 'Dr. Sarah Johnson',
    category: 'Healthcare',
    experience: 15,
    rating: 4.8,
    email: 'sarah.johnson@healthcare.com',
    phone: '+1234567890',
    bio: 'Experienced medical doctor specializing in internal medicine and preventive care.',
    timeSlots: generateTimeSlots()
  },
  {
    name: 'John Smith',
    category: 'Technology',
    experience: 12,
    rating: 4.9,
    email: 'john.smith@tech.com',
    phone: '+1234567891',
    bio: 'Senior software engineer with expertise in cloud architecture and DevOps.',
    timeSlots: generateTimeSlots()
  },
  {
    name: 'Emily Chen',
    category: 'Finance',
    experience: 10,
    rating: 4.7,
    email: 'emily.chen@finance.com',
    phone: '+1234567892',
    bio: 'Certified financial planner helping individuals and businesses with investment strategies.',
    timeSlots: generateTimeSlots()
  },
  {
    name: 'Michael Brown',
    category: 'Education',
    experience: 20,
    rating: 4.9,
    email: 'michael.brown@education.com',
    phone: '+1234567893',
    bio: 'Experienced educator and curriculum developer specializing in STEM education.',
    timeSlots: generateTimeSlots()
  },
  {
    name: 'Lisa Anderson',
    category: 'Consulting',
    experience: 8,
    rating: 4.6,
    email: 'lisa.anderson@consulting.com',
    phone: '+1234567894',
    bio: 'Business consultant helping startups and small businesses with growth strategies.',
    timeSlots: generateTimeSlots()
  }
];

function generateTimeSlots() {
  const slots = [];
  const today = new Date();
  
  // Generate slots for next 7 days
  for (let day = 0; day < 7; day++) {
    const currentDate = new Date(today);
    currentDate.setDate(today.getDate() + day);
    
    // Generate slots from 9 AM to 6 PM
    for (let hour = 9; hour < 18; hour++) {
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

    // Clear existing experts
    await Expert.deleteMany({});
    console.log('Cleared existing experts');

    // Insert sample experts
    await Expert.insertMany(sampleExperts);
    console.log('Inserted sample experts');

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
