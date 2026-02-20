# MongoDB Setup Guide

## 🚀 Quick MongoDB Setup for Expert Booking System

### Option 1: MongoDB Community Server (Recommended for Development)

#### Windows Installation
1. **Download MongoDB Community Server**
   - Go to https://www.mongodb.com/try/download/community
   - Select Windows version
   - Choose MSI installer
   - Download and run the installer

2. **Installation Steps**
   - Choose "Complete" installation
   - Install MongoDB Compass (optional GUI tool)
   - Install as a Windows service
   - Leave default settings

3. **Start MongoDB Service**
   ```powershell
   # As Administrator
   net start MongoDB
   ```

4. **Verify Installation**
   ```powershell
   # Check if MongoDB is running
   mongo --eval "db.adminCommand('ismaster')"
   ```

#### macOS Installation
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB service
brew services start mongodb/brew/mongodb-community

# Verify installation
mongosh --eval "db.adminCommand('ismaster')"
```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update package list and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB service
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify installation
mongosh --eval "db.adminCommand('ismaster')"
```

### Option 2: MongoDB Atlas (Cloud Database)

1. **Create Account**
   - Go to https://www.mongodb.com/atlas
   - Sign up for free account

2. **Create Cluster**
   - Click "Build a Cluster"
   - Choose "M0 Sandbox" (free tier)
   - Select cloud provider and region
   - Create cluster

3. **Configure Network Access**
   - Go to "Network Access"
   - Add IP address: `0.0.0.0/0` (for development)
   - Or add your specific IP address

4. **Create Database User**
   - Go to "Database Access"
   - Add new user with username and password
   - Grant read/write permissions

5. **Get Connection String**
   - Go to "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your user password

6. **Update .env file**
   ```
   MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/expert-booking-system?retryWrites=true&w=majority
   ```

### Option 3: Docker (Quick Setup)

```bash
# Pull MongoDB image
docker pull mongo

# Run MongoDB container
docker run --name mongodb -p 27017:27017 -d mongo

# Verify connection
docker exec -it mongodb mongosh --eval "db.adminCommand('ismaster')"
```

## 🔧 Configuration

### Update .env file
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/expert-booking-system
NODE_ENV=development
```

### For MongoDB Atlas
```env
PORT=5000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expert-booking-system?retryWrites=true&w=majority
NODE_ENV=development
```

## 🗄️ Database Setup

### 1. Seed the Database
```bash
cd server
node seed.js
```

This will create:
- 5 sample experts with time slots
- Proper database indexes
- Sample data for testing

### 2. Verify Database
```bash
# Connect to MongoDB
mongosh

# Switch to database
use expert-booking-system

# List collections
show collections

# View experts
db.experts.find().pretty()

# View bookings
db.bookings.find().pretty()
```

## 🛠️ MongoDB GUI Tools

### MongoDB Compass (Recommended)
- Download from https://www.mongodb.com/try/download/compass
- Connect to your database
- Visual database management

### Studio 3T
- Free alternative to MongoDB Compass
- Advanced features for development

## 🔍 Troubleshooting

### Common Issues

#### 1. MongoDB Service Not Starting (Windows)
```powershell
# Check service status
Get-Service MongoDB

# Start service manually
Start-Service MongoDB

# Check logs
Get-EventLog -LogName Application -Source "MongoDB"
```

#### 2. Connection Refused
```bash
# Check if MongoDB is running
netstat -an | grep 27017

# On Linux/macOS
sudo lsof -i :27017
```

#### 3. Authentication Issues
```bash
# Connect with authentication
mongosh --username <user> --password --authenticationDatabase admin
```

#### 4. Firewall Issues
- Windows: Allow MongoDB through Windows Firewall
- macOS: `sudo ufw allow 27017`
- Linux: `sudo ufw allow 27017`

### Database Commands

#### Reset Database
```bash
# Connect to MongoDB
mongosh

# Drop and recreate database
use expert-booking-system
db.dropDatabase()
exit

# Re-seed data
cd server
node seed.js
```

#### Backup Database
```bash
# Create backup
mongodump --db expert-booking-system --out ./backup

# Restore backup
mongorestore --db expert-booking-system ./backup/expert-booking-system
```

## 📊 Database Schema

### Experts Collection
```javascript
{
  _id: ObjectId,
  name: String,
  category: String, // Technology, Healthcare, Finance, etc.
  experience: Number,
  rating: Number,
  email: String,
  phone: String,
  bio: String,
  timeSlots: [{
    date: Date,
    startTime: String,
    endTime: String,
    isBooked: Boolean
  }],
  isActive: Boolean,
  createdAt: Date,
  updatedAt: Date
}
```

### Bookings Collection
```javascript
{
  _id: ObjectId,
  expertId: ObjectId,
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  date: Date,
  startTime: String,
  endTime: String,
  notes: String,
  status: String, // Pending, Confirmed, Completed, Cancelled
  bookingId: String,
  createdAt: Date,
  updatedAt: Date
}
```

## 🚀 Next Steps

1. **Install MongoDB** using one of the options above
2. **Start MongoDB service**
3. **Update .env file** with correct connection string
4. **Seed the database** with sample data
5. **Start the application**:
   ```bash
   # Backend
   cd server && npm run dev
   
   # Mobile
   cd mobile && npm start
   ```

Your Expert Booking System will be ready to use with a fully functional MongoDB database!
