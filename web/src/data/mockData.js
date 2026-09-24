export const MOCK_CATEGORIES = [
  { _id: 'cat-1', name: 'Healthcare & Hospitals' },
  { _id: 'cat-2', name: 'Corporate & Brands' },
  { _id: 'cat-3', name: 'Cinemas & Entertainment' },
  { _id: 'cat-4', name: 'Education & Schools' },
  { _id: 'cat-5', name: 'Legal & Advisory' },
  { _id: 'cat-6', name: 'Hospitality & Tourism' },
  { _id: 'cat-7', name: 'Business & Finance' },
  { _id: 'cat-8', name: 'IT & Tech Support' }
];

const today = new Date().toISOString().split('T')[0];
const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

export const MOCK_EXPERTS = [
  {
    _id: 'exp-1',
    name: 'Dr. Aarav Sharma',
    companyName: 'Apollo Speciality Care',
    category: 'Healthcare & Hospitals',
    bio: 'Senior Consultant & Clinical Specialist with 12+ years of experience in preventative healthcare and comprehensive patient counseling.',
    rating: 4.9,
    experience: 12,
    isApproved: true,
    sessionType: 'Video Call / In-Clinic',
    location: 'Delhi-NCR, India',
    services: [
      { _id: 'srv-101', title: 'Clinical Consultation', name: 'Clinical Consultation', price: 999, duration: 45, type: 'Session' },
      { _id: 'srv-102', title: 'Second Opinion & Report Review', name: 'Second Opinion & Report Review', price: 1499, duration: 60, type: 'Consultation' }
    ],
    groupedTimeSlots: {
      [today]: [
        { _id: 's-1', startTime: '10:00 AM', endTime: '10:45 AM', isBooked: false },
        { _id: 's-2', startTime: '11:30 AM', endTime: '12:15 PM', isBooked: false },
        { _id: 's-3', startTime: '02:00 PM', endTime: '02:45 PM', isBooked: false }
      ],
      [tomorrow]: [
        { _id: 's-4', startTime: '04:00 PM', endTime: '04:45 PM', isBooked: false },
        { _id: 's-5', startTime: '05:30 PM', endTime: '06:15 PM', isBooked: false }
      ]
    }
  },
  {
    _id: 'exp-2',
    name: 'Adv. Priya Malhotra',
    companyName: 'Malhotra & Partners Legal',
    category: 'Legal & Advisory',
    bio: 'Corporate Law Attorney specializing in IP rights, startup advisory, contracts, and business regulatory compliance.',
    rating: 4.8,
    experience: 9,
    isApproved: true,
    sessionType: 'Online Meeting',
    location: 'New Delhi, India',
    services: [
      { _id: 'srv-201', title: 'Legal Advisory Session', name: 'Legal Advisory Session', price: 1800, duration: 60, type: 'Session' },
      { _id: 'srv-202', title: 'Contract & Agreement Review', name: 'Contract & Agreement Review', price: 2500, duration: 90, type: 'Service' }
    ],
    groupedTimeSlots: {
      [today]: [
        { _id: 's-6', startTime: '03:00 PM', endTime: '04:00 PM', isBooked: false }
      ],
      [tomorrow]: [
        { _id: 's-7', startTime: '11:00 AM', endTime: '12:00 PM', isBooked: false },
        { _id: 's-8', startTime: '02:30 PM', endTime: '03:30 PM', isBooked: false }
      ]
    }
  },
  {
    _id: 'exp-3',
    name: 'Rohan Verma',
    companyName: 'CloudScale Solutions',
    category: 'IT & Tech Support',
    bio: 'Principal Cloud Architect and Full-Stack Consultant guiding companies on AWS/GCP migration, microservices, and React performance.',
    rating: 5.0,
    experience: 11,
    isApproved: true,
    sessionType: 'Remote Screen Share',
    location: 'Bengaluru / Remote',
    services: [
      { _id: 'srv-301', title: 'System Architecture Review', name: 'System Architecture Review', price: 2000, duration: 60, type: 'Session' },
      { _id: 'srv-302', title: 'Tech Stack 1:1 Mentorship', name: 'Tech Stack 1:1 Mentorship', price: 1200, duration: 45, type: 'Session' }
    ],
    groupedTimeSlots: {
      [today]: [
        { _id: 's-9', startTime: '06:00 PM', endTime: '07:00 PM', isBooked: false }
      ],
      [tomorrow]: [
        { _id: 's-10', startTime: '07:00 PM', endTime: '08:00 PM', isBooked: false }
      ]
    }
  },
  {
    _id: 'exp-4',
    name: 'Neha Kapoor, CA',
    companyName: 'Apex Financial Advisory',
    category: 'Business & Finance',
    bio: 'Chartered Accountant and Startup Finance Advisor helping founders with tax planning, valuations, and financial audits.',
    rating: 4.9,
    experience: 8,
    isApproved: true,
    sessionType: 'Video Consultation',
    location: 'Mumbai, India',
    services: [
      { _id: 'srv-401', title: 'Tax Strategy & Compliance', name: 'Tax Strategy & Compliance', price: 1500, duration: 45, type: 'Consultation' },
      { _id: 'srv-402', title: 'Startup Valuation Review', name: 'Startup Valuation Review', price: 3000, duration: 60, type: 'Service' }
    ],
    groupedTimeSlots: {
      [today]: [
        { _id: 's-11', startTime: '01:00 PM', endTime: '01:45 PM', isBooked: false }
      ],
      [tomorrow]: [
        { _id: 's-12', startTime: '03:30 PM', endTime: '04:15 PM', isBooked: false }
      ]
    }
  },
  {
    _id: 'exp-5',
    name: 'Prof. Vikram Singh',
    companyName: 'Global EdTech Mentors',
    category: 'Education & Schools',
    bio: 'Academic Consultant with 15+ years of experience guiding postgraduate students, MCA candidates, and researchers on capstone projects.',
    rating: 4.9,
    experience: 15,
    isApproved: true,
    sessionType: 'Live Video Discussion',
    location: 'Ghaziabad, India',
    services: [
      { _id: 'srv-501', title: 'Academic & Career Counseling', name: 'Academic & Career Counseling', price: 800, duration: 45, type: 'Session' },
      { _id: 'srv-502', title: 'Synopsis & Research Review', name: 'Synopsis & Research Review', price: 1200, duration: 60, type: 'Session' }
    ],
    groupedTimeSlots: {
      [today]: [
        { _id: 's-13', startTime: '05:00 PM', endTime: '05:45 PM', isBooked: false }
      ],
      [tomorrow]: [
        { _id: 's-14', startTime: '10:00 AM', endTime: '10:45 AM', isBooked: false }
      ]
    }
  }
];

export const MOCK_STATS = {
  activeSessions: 120,
  totalImpact: 15000,
  expertCommunity: 53,
  satisfiedUsers: 1202
};
