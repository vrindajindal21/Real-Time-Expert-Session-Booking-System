// Mock data for offline testing
const mockExperts = [
  {
    _id: '1',
    name: 'Dr. Sarah Johnson',
    category: 'Technology',
    experience: 10,
    rating: 4.8,
    email: 'sarah.j@example.com',
    phone: '+1234567890',
    bio: 'Expert in React Native and mobile app development with over 10 years of experience.',
    timeSlots: [
      { date: '2024-02-23', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-23', startTime: '10:00', endTime: '11:00', isBooked: true },
      { date: '2024-02-23', startTime: '14:00', endTime: '15:00', isBooked: false },
      { date: '2024-02-24', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-24', startTime: '11:00', endTime: '12:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '2',
    name: 'Dr. Michael Chen',
    category: 'Healthcare',
    experience: 15,
    rating: 4.9,
    email: 'michael.c@example.com',
    phone: '+1234567891',
    bio: 'Specialized in healthcare technology and medical software development.',
    timeSlots: [
      { date: '2024-02-23', startTime: '11:00', endTime: '12:00', isBooked: false },
      { date: '2024-02-23', startTime: '15:00', endTime: '16:00', isBooked: false },
      { date: '2024-02-25', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-25', startTime: '14:00', endTime: '15:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '3',
    name: 'Prof. Emily Davis',
    category: 'Finance',
    experience: 12,
    rating: 4.7,
    email: 'emily.d@example.com',
    phone: '+1234567892',
    bio: 'Financial technology expert with expertise in blockchain and digital payments.',
    timeSlots: [
      { date: '2024-02-24', startTime: '10:00', endTime: '11:00', isBooked: false },
      { date: '2024-02-24', startTime: '13:00', endTime: '14:00', isBooked: false },
      { date: '2024-02-26', startTime: '09:00', endTime: '10:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '4',
    name: 'Dr. James Wilson',
    category: 'Education',
    experience: 8,
    rating: 4.6,
    email: 'james.w@example.com',
    phone: '+1234567893',
    bio: 'Educational technology specialist focusing on e-learning platforms.',
    timeSlots: [
      { date: '2024-02-23', startTime: '13:00', endTime: '14:00', isBooked: false },
      { date: '2024-02-25', startTime: '10:00', endTime: '11:00', isBooked: false },
      { date: '2024-02-25', startTime: '15:00', endTime: '16:00', isBooked: false },
    ],
    isActive: true
  },
  {
    _id: '5',
    name: 'Dr. Lisa Anderson',
    category: 'Consulting',
    experience: 20,
    rating: 4.9,
    email: 'lisa.a@example.com',
    phone: '+1234567894',
    bio: 'Business consulting expert with 20 years of experience in strategy and management.',
    timeSlots: [
      { date: '2024-02-24', startTime: '09:00', endTime: '10:00', isBooked: false },
      { date: '2024-02-24', startTime: '11:00', endTime: '12:00', isBooked: false },
      { date: '2024-02-26', startTime: '10:00', endTime: '11:00', isBooked: false },
      { date: '2024-02-26', startTime: '14:00', endTime: '15:00', isBooked: false },
    ],
    isActive: true
  }
];

const mockBookings = [
  {
    _id: '1',
    expertId: '1',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '+1234567890',
    date: '2024-02-20',
    startTime: '09:00',
    endTime: '10:00',
    notes: 'First consultation',
    status: 'Confirmed',
    bookingId: 'BK001',
    createdAt: new Date('2024-02-19'),
    updatedAt: new Date('2024-02-20')
  },
  {
    _id: '2',
    expertId: '2',
    customerName: 'Jane Smith',
    customerEmail: 'jane@example.com',
    customerPhone: '+1234567891',
    date: '2024-02-21',
    startTime: '14:00',
    endTime: '15:00',
    notes: 'Follow-up session',
    status: 'Pending',
    bookingId: 'BK002',
    createdAt: new Date('2024-02-20'),
    updatedAt: new Date('2024-02-21')
  }
];

export { mockExperts, mockBookings };
