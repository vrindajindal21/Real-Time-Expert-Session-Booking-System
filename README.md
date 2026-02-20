# Real-Time Expert Session Booking System

A comprehensive mobile application and backend system for booking expert consultation sessions with real-time slot updates.

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Socket.io** - Real-time communication
- **Mongoose** - MongoDB ODM
- **Joi** - Input validation

### Mobile App
- **React Native** - Mobile framework
- **Expo** - Development platform
- **React Navigation** - Navigation
- **React Native Paper** - UI components
- **Socket.io Client** - Real-time client

## Features

### Expert Listing Screen
- ✅ Display experts with name, category, experience, and rating
- ✅ Search experts by name
- ✅ Filter by category
- ✅ Pagination support
- ✅ Loading and error states

### Expert Detail Screen
- ✅ Show comprehensive expert details
- ✅ Display available time slots grouped by date
- ✅ Real-time slot updates when booked by other users
- ✅ Visual indicators for booked and past slots

### Booking Screen
- ✅ Form validation for all fields
- ✅ Success message after booking
- ✅ Automatic slot disabling after booking
- ✅ Double booking prevention

### My Bookings Screen
- ✅ Search bookings by email
- ✅ Display booking status (Pending, Confirmed, Completed, Cancelled)
- ✅ Cancel pending bookings
- ✅ Expert contact information

### Backend Features
- ✅ Proper folder structure (routes/controllers/models)
- ✅ All required API endpoints
- ✅ Double booking prevention with race condition handling
- ✅ Real-time slot updates via Socket.io
- ✅ Comprehensive error handling
- ✅ Environment variable configuration

## Project Structure

```
expert-booking-system/
├── server/
│   ├── controllers/
│   │   ├── expertController.js
│   │   └── bookingController.js
│   ├── models/
│   │   ├── Expert.js
│   │   └── Booking.js
│   ├── routes/
│   │   ├── experts.js
│   │   └── bookings.js
│   ├── index.js
│   └── seed.js
├── mobile/
│   ├── src/
│   │   ├── config/
│   │   │   └── api.js
│   │   ├── services/
│   │   │   └── socketService.js
│   │   └── screens/
│   │       ├── ExpertListScreen.js
│   │       ├── ExpertDetailScreen.js
│   │       ├── BookingScreen.js
│   │       └── MyBookingsScreen.js
│   ├── App.js
│   ├── App.json
│   └── package.json
├── package.json
├── .env
└── README.md
```

## API Endpoints

### Experts
- `GET /api/experts` - Get all experts with pagination and filtering
- `GET /api/experts/:id` - Get expert details with time slots

### Bookings
- `POST /api/bookings` - Create a new booking
- `GET /api/bookings?email=` - Get bookings by email
- `PATCH /api/bookings/:id/status` - Update booking status

## Installation & Setup

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (local or cloud instance)
- Expo CLI (for mobile development)

### Backend Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and other configurations
   ```

4. Seed the database with sample experts:
   ```bash
   node server/seed.js
   ```

5. Start the backend server:
   ```bash
   npm run dev
   ```

### Mobile App Setup

1. Navigate to mobile directory:
   ```bash
   cd mobile
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. Use Expo Go app on your mobile device to scan the QR code

## Key Features Implementation

### Double Booking Prevention
- MongoDB compound indexes to prevent duplicate bookings
- Database transactions for atomic operations
- Real-time validation checks

### Real-Time Updates
- Socket.io integration for instant slot availability updates
- Room-based communication for expert-specific updates
- Automatic UI refresh when slots are booked

### Error Handling
- Comprehensive validation on both client and server
- Meaningful error messages
- Graceful degradation for network issues

### Performance Optimizations
- Pagination for large expert lists
- Efficient database queries with proper indexing
- Optimized real-time communication

## Testing

The system includes comprehensive error handling and validation. Test scenarios include:
- Creating bookings with valid/invalid data
- Double booking attempts
- Real-time slot updates
- Network failure scenarios
- Edge cases with past dates and invalid inputs

## Deployment

### Backend Deployment Options
- Heroku
- AWS EC2
- DigitalOcean
- Any Node.js hosting service

### Mobile App Deployment
- App Store (iOS)
- Google Play Store (Android)
- Expo Application Services (EAS)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
