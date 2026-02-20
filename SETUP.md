# Setup Instructions

## Prerequisites

1. **Node.js** (v14 or higher)
2. **MongoDB** - Install and start MongoDB service

### MongoDB Installation

#### Windows
1. Download MongoDB Community Server from https://www.mongodb.com/try/download/community
2. Run the installer
3. Start MongoDB service:
   ```bash
   # As Administrator
   net start MongoDB
   ```

#### macOS
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
brew services start mongodb/brew/mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
sudo systemctl enable mongodb
```

## Project Setup

### 1. Clone and Install Dependencies

```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..

# Install mobile dependencies
cd mobile
npm install
cd ..
```

### 2. Environment Configuration

The `.env` file is already configured for local development:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expert-booking-system
NODE_ENV=development
```

### 3. Seed Database

Make sure MongoDB is running, then:
```bash
cd server
node seed.js
```

### 4. Start Backend Server

```bash
cd server
npm run dev
```

The server will start on `http://localhost:5000`

### 5. Start Mobile App

```bash
cd mobile
npm start
```

Scan the QR code with Expo Go app on your mobile device.

## Testing the API

You can test the API endpoints using curl or Postman:

### Get all experts
```bash
curl http://localhost:5000/api/experts
```

### Get expert by ID
```bash
curl http://localhost:5000/api/experts/[EXPERT_ID]
```

### Create a booking
```bash
curl -X POST http://localhost:5000/api/bookings \
  -H "Content-Type: application/json" \
  -d '{
    "expertId": "[EXPERT_ID]",
    "customerName": "John Doe",
    "customerEmail": "john@example.com",
    "customerPhone": "1234567890",
    "date": "2024-01-15",
    "startTime": "09:00",
    "endTime": "10:00"
  }'
```

### Get bookings by email
```bash
curl "http://localhost:5000/api/bookings?email=john@example.com"
```

## Troubleshooting

### MongoDB Connection Issues
- Ensure MongoDB service is running
- Check if MongoDB is listening on port 27017
- Verify the connection string in `.env` file

### Port Conflicts
- Change the PORT in `.env` file if port 5000 is already in use

### Mobile App Issues
- Ensure your phone and computer are on the same network
- Check if firewall is blocking the connection
- Make sure the backend server is running

## Features Verification

1. **Expert Listing**: Browse, search, and filter experts
2. **Real-time Updates**: Open the app on two devices and book the same slot to see real-time updates
3. **Double Booking Prevention**: Try to book the same slot twice
4. **Booking Management**: View and cancel your bookings
5. **Form Validation**: Test with invalid inputs

## Production Deployment

For production deployment, consider:
- Using MongoDB Atlas (cloud database)
- Deploying backend to Heroku, AWS, or similar
- Building and publishing the mobile app to app stores
