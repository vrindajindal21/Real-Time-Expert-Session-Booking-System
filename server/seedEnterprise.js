const mongoose = require('mongoose');
const User = require('./models/User');
const Expert = require('./models/Expert');
const Booking = require('./models/Booking');
const Category = require('./models/Category');
const Review = require('./models/Review');
const Staff = require('./models/Staff');
require('dotenv').config();

const seed = async () => {
    try {
        console.log('🚀 Starting Enterprise Seed...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Wipe everything
        await Promise.all([
            User.deleteMany({}),
            Expert.deleteMany({}),
            Booking.deleteMany({}),
            Category.deleteMany({}),
            Review.deleteMany({})
        ]);
        console.log('🗑️  Database cleared');

        // 2. Create Categories
        const categoriesData = [
            { name: 'Healthcare', icon: 'Stethoscope', description: 'Medical professionals and consultants' },
            { name: 'Education', icon: 'BookOpen', description: 'Tutors and academic experts' },
            { name: 'Consulting', icon: 'Briefcase', description: 'Business and career mentors' },
            { name: 'Fitness', icon: 'Activity', description: 'Yoga masters and personal trainers' },
            { name: 'Finance', icon: 'PieChart', description: 'Financial advisors and tax consultants' },
            { name: 'Legal', icon: 'Shield', description: 'Attorneys and legal consultants' }
        ];
        await Category.insertMany(categoriesData);
        console.log('✅ Categories seeded');

        // 3. Create Users (1 Admin, 5 Experts, 3 Customers)
        const commonPassword = 'Password123';

        await User.create({
            name: 'Super Admin',
            email: 'admin@expertbooking.com',
            password: commonPassword,
            role: 'admin'
        });

        const customerUsers = await User.insertMany([
            { name: 'Aarav Gupta', email: 'aarav@gmail.com', password: commonPassword, role: 'user' },
            { name: 'Sanya Iyer', email: 'sanya@gmail.com', password: commonPassword, role: 'user' },
            { name: 'Vikram Singh', email: 'vikram@gmail.com', password: commonPassword, role: 'user' }
        ]);

        const expertUsers = await User.insertMany([
            { name: 'Dr. Sarah Wilson', email: 'sarah@healthcare.com', password: commonPassword, role: 'expert' },
            { name: 'Prof. James Chen', email: 'james@edtech.com', password: commonPassword, role: 'expert' },
            { name: 'Elena Rodriguez', email: 'elena@fitness.com', password: commonPassword, role: 'expert' },
            { name: 'David Miller', email: 'david@consulting.com', password: commonPassword, role: 'expert' },
            { name: 'Meera Reddy', email: 'meera@finance.com', password: commonPassword, role: 'expert' }
        ]);
        console.log('✅ Users seeded');

        // 4. Create Expert Profiles
        const experts = await Expert.insertMany([
            {
                userId: expertUsers[0]._id,
                name: expertUsers[0].name,
                email: expertUsers[0].email,
                category: 'Healthcare',
                bio: 'Senior Dermatologist with 15+ years of experience in clinical and cosmetic dermatology. Specializing in advanced skin treatments.',
                companyName: 'City Skin Clinic',
                experience: 15,
                phone: '9876543210',
                sessionType: 'Online',
                services: [
                    { title: 'Skin Consultation', price: 1200, duration: 30, description: 'Complete skin analysis', type: 'Session' },
                    { title: 'Follow-up Checkup', price: 600, duration: 15, description: 'Monthly review', type: 'Session' }
                ],
                timeSlots: [
                    { date: new Date('2026-04-25'), startTime: '09:00 AM', endTime: '09:30 AM', isBooked: false },
                    { date: new Date('2026-04-25'), startTime: '10:00 AM', endTime: '10:30 AM', isBooked: false }
                ]
            },
            {
                userId: expertUsers[1]._id,
                name: expertUsers[1].name,
                email: expertUsers[1].email,
                phone: '9876543211',
                category: 'Education',
                bio: 'IIT-Bombay Alum and Mathematics Professor. Helped over 5000 students crack competitive exams with simplified logic.',
                companyName: 'James Math Academy',
                experience: 12,
                rating: 5.0,
                isApproved: true,
                isActive: true,
                sessionType: 'Online',
                services: [
                    { title: 'Calculus Mastery', price: 2000, duration: 60, description: 'Advanced calculus session', type: 'Session' },
                    { title: 'Entrance Coaching', price: 1500, duration: 45, description: 'JEE/GRE Prep', type: 'Session' }
                ],
                timeSlots: []
            },
            {
                userId: expertUsers[2]._id,
                name: expertUsers[2].name,
                email: expertUsers[2].email,
                phone: '9876543212',
                category: 'Fitness',
                bio: 'Certified Yoga Master and holistic health coach. Focus on mental clarity and physical flexibility through Vinyasa Flow.',
                companyName: 'Zen Flow Studio',
                experience: 8,
                rating: 4.8,
                isApproved: true,
                isActive: true,
                sessionType: 'Online',
                services: [
                    { title: 'Vinyasa Flow', price: 800, duration: 45, description: 'Full body movement', type: 'Session' },
                    { title: 'Guided Meditation', price: 500, duration: 30, description: 'Stress relief session', type: 'Session' }
                ],
                timeSlots: []
            }
        ]);
        console.log('✅ Expert profiles seeded');

        // 5. Seed some Bookings (completed/confirmed for analytics)
        const seededBookings = await Booking.insertMany([
            {
                expertId: experts[0]._id,
                customerId: customerUsers[0]._id,
                customerName: customerUsers[0].name,
                customerEmail: customerUsers[0].email,
                customerPhone: '9876543210',
                serviceTitle: 'Skin Consultation',
                price: 1200,
                date: new Date('2026-04-10'),
                startTime: '10:00 AM',
                endTime: '10:30 AM',
                status: 'Completed',
                bookingId: 'BK_SEED_1'
            },
            {
                expertId: experts[0]._id,
                customerId: customerUsers[1]._id,
                customerName: customerUsers[1].name,
                customerEmail: customerUsers[1].email,
                customerPhone: '9876543211',
                serviceTitle: 'Follow-up Checkup',
                price: 600,
                date: new Date('2026-04-15'),
                startTime: '11:00 AM',
                endTime: '11:15 AM',
                status: 'Completed',
                bookingId: 'BK_SEED_2'
            },
            {
                expertId: experts[1]._id,
                customerId: customerUsers[2]._id,
                customerName: customerUsers[2].name,
                customerEmail: customerUsers[2].email,
                customerPhone: '9876543212',
                serviceTitle: 'Calculus Mastery',
                price: 2000,
                date: new Date('2026-04-20'),
                startTime: '04:00 PM',
                endTime: '05:00 PM',
                status: 'Completed',
                bookingId: 'BK_SEED_3'
            }
        ]);
        console.log('✅ Mock bookings seeded');

        // 6. Seed Reviews (The "Client Say" part)
        await Review.insertMany([
            {
                bookingId: seededBookings[0]._id,
                expertId: experts[0]._id,
                customerId: customerUsers[0]._id,
                rating: 5,
                comment: 'The best dermatologist I have ever visited. Her diagnosis is very precise and she actually listens to the patient.',
            },
            {
                bookingId: seededBookings[1]._id,
                expertId: experts[0]._id,
                customerId: customerUsers[1]._id,
                rating: 5,
                comment: 'Very professional. The video quality was great and all my queries were resolved.',
            },
            {
                bookingId: seededBookings[2]._id,
                expertId: experts[1]._id,
                customerId: customerUsers[2]._id,
                rating: 5,
                comment: 'Math used to be my nightmare, but James makes it look like a puzzle game. Highly recommended!',
            }
        ]);
        console.log('✅ Client testimonials seeded');

        // 7. Add a "Hospital" Demo with Staff
        const hospitalUser = await User.create({
            name: 'City General Hospital',
            email: 'admin@cityhospital.com',
            password: commonPassword,
            role: 'expert'
        });

        const hospital = await Expert.create({
            userId: hospitalUser._id,
            name: 'City General Hospital',
            email: 'admin@cityhospital.com',
            phone: '1112223333',
            category: 'Healthcare',
            providerType: 'Company',
            companyName: 'City Healthcare Group',
            bio: 'Leading multi-specialty hospital with expert surgeons and world-class facilities.',
            experience: 25,
            rating: 4.9,
            isApproved: true,
            isActive: true,
            sessionType: 'In-Person',
            location: 'New Delhi, India',
            services: [
                { title: 'Surgical Consultation', price: 5000, duration: 45, type: 'Session' },
                { title: 'General Checkup', price: 800, duration: 20, type: 'Session' }
            ]
        });

        await Staff.insertMany([
            { expertId: hospital._id, name: 'Dr. John Doe', role: 'Senior Surgeon', specialization: ['Cardiac', 'Thoracic'], isActive: true },
            { expertId: hospital._id, name: 'Dr. Jane Smith', role: 'Physician', specialization: ['General Medicine'], isActive: true }
        ]);

        console.log('✅ Hospital Organization Demo seeded');

        console.log('\n🌟 Provider Hub & Organization Seed Completed!');
        process.exit();
    } catch (err) {
        console.error('❌ Seed Failed:', err);
        process.exit(1);
    }
};

seed();
