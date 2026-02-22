import { mockExperts, mockBookings } from './mockData';

// Simulate network delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Mock API service
const mockApi = {
  // Get all experts with pagination and filtering
  getExperts: async (params = {}) => {
    await delay(800); // Simulate network delay
    
    let filteredExperts = [...mockExperts];
    
    // Apply search filter
    if (params.search) {
      filteredExperts = filteredExperts.filter(expert => 
        expert.name.toLowerCase().includes(params.search.toLowerCase()) ||
        expert.bio.toLowerCase().includes(params.search.toLowerCase())
      );
    }
    
    // Apply category filter
    if (params.category && params.category !== 'All') {
      filteredExperts = filteredExperts.filter(expert => 
        expert.category === params.category
      );
    }
    
    // Apply pagination
    const page = params.page || 1;
    const limit = params.limit || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedExperts = filteredExperts.slice(startIndex, endIndex);
    
    return {
      data: {
        experts: paginatedExperts,
        pagination: {
          current: page,
          pages: Math.ceil(filteredExperts.length / limit),
          total: filteredExperts.length,
          limit: limit
        }
      }
    };
  },
  
  // Get expert by ID
  getExpert: async (expertId) => {
    await delay(500);
    const expert = mockExperts.find(e => e._id === expertId);
    if (!expert) {
      throw new Error('Expert not found');
    }
    return { data: expert };
  },
  
  // Create booking
  createBooking: async (bookingData) => {
    await delay(1000);
    const newBooking = {
      _id: Date.now().toString(),
      ...bookingData,
      status: 'Pending',
      bookingId: `BK${Date.now().toString().slice(-6)}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    mockBookings.push(newBooking);
    
    // Mark the time slot as booked
    const expert = mockExperts.find(e => e._id === bookingData.expertId);
    if (expert) {
      const slot = expert.timeSlots.find(s => 
        s.date === bookingData.date && 
        s.startTime === bookingData.startTime
      );
      if (slot) {
        slot.isBooked = true;
      }
    }
    
    return { data: newBooking };
  },
  
  // Get bookings by email
  getBookings: async (params = {}) => {
    await delay(600);
    const email = params.email;
    if (!email) {
      return { data: [] };
    }
    
    const userBookings = mockBookings.filter(booking => 
      booking.customerEmail.toLowerCase() === email.toLowerCase()
    );
    
    // Add expert details to bookings
    const bookingsWithExperts = userBookings.map(booking => {
      const expert = mockExperts.find(e => e._id === booking.expertId);
      return {
        ...booking,
        expert: expert ? {
          name: expert.name,
          email: expert.email,
          phone: expert.phone,
          category: expert.category
        } : null
      };
    });
    
    return { data: bookingsWithExperts };
  },
  
  // Update booking status
  updateBookingStatus: async (bookingId, status) => {
    await delay(500);
    const booking = mockBookings.find(b => b._id === bookingId);
    if (!booking) {
      throw new Error('Booking not found');
    }
    
    booking.status = status;
    booking.updatedAt = new Date();
    
    return { data: booking };
  }
};

export default mockApi;
