const mongoose = require('mongoose');

/**
 * Resource — Bookable physical/virtual assets beyond just human experts.
 * Examples:
 *   - Hospital: Operating theatre, MRI machine, consultation room
 *   - Gym: Swimming lane, squash court, yoga studio
 *   - Corporate: Boardroom, conference suite, AV equipment
 *   - Law firm: Client meeting room, video conferencing suite
 *   - Hotel: Event hall, rooftop terrace
 */
const resourceSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  name: {
    type: String,
    required: [true, 'Resource name is required'],
    trim: true,
    maxlength: 200
  },
  description: { type: String, trim: true, maxlength: 1000 },
  resourceType: {
    type: String,
    enum: ['room', 'equipment', 'vehicle', 'virtual', 'outdoor', 'other'],
    default: 'room'
  },
  category: {
    type: String,
    trim: true // e.g. 'Conference Room', 'Medical Equipment', 'Sports Facility'
  },

  // Capacity
  capacity: { type: Number, default: 1 },     // Max people
  minBookingHours: { type: Number, default: 1 },
  maxBookingHours: { type: Number, default: 8 },

  // Pricing
  pricePerHour: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },

  // Location (for multi-location companies)
  location: {
    branch: { type: String, trim: true },
    floor: { type: String, trim: true },
    room: { type: String, trim: true },
    address: { type: String, trim: true }
  },

  // Amenities/features
  amenities: [{ type: String, trim: true }], // e.g. ['Projector', 'Whiteboard', 'AC']

  // Images
  images: [{ type: String }],

  // Availability
  isActive: { type: Boolean, default: true },
  requiresApproval: { type: Boolean, default: false }, // Some resources need admin approval

  // Maintenance windows (blocked times)
  maintenanceBlocks: [{
    startDate: Date,
    endDate: Date,
    reason: String
  }],

  // Stats
  stats: {
    totalBookings: { type: Number, default: 0 },
    totalHoursBooked: { type: Number, default: 0 },
    utilizationRate: { type: Number, default: 0 } // 0-100%
  }

}, { timestamps: true });

// Indexes
resourceSchema.index({ companyId: 1, isActive: 1 });
resourceSchema.index({ companyId: 1, resourceType: 1 });
resourceSchema.index({ 'location.branch': 1, companyId: 1 });

module.exports = mongoose.model('Resource', resourceSchema);
