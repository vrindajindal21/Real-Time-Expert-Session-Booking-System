const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Customer is required']
  },
  customerName: {
    type: String,
    required: [true, 'Customer name is required'],
    trim: true
  },
  customerAvatar: {
    type: String,
    trim: true
  },
  customerTitle: {
    type: String,
    trim: true
  },
  customerCompany: {
    type: String,
    trim: true
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: 1,
    max: 5
  },
  title: {
    type: String,
    required: [true, 'Testimonial title is required'],
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  content: {
    type: String,
    required: [true, 'Testimonial content is required'],
    trim: true,
    maxlength: [1000, 'Content cannot exceed 1000 characters']
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  isFeatured: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  response: {
    content: {
      type: String,
      trim: true,
      maxlength: [1000, 'Response cannot exceed 1000 characters']
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    respondedAt: Date
  }
}, {
  timestamps: true
});

// Indexes for performance
testimonialSchema.index({ companyId: 1, isActive: 1, isFeatured: 1 });
testimonialSchema.index({ customerId: 1 });
testimonialSchema.index({ rating: -1 });
testimonialSchema.index({ createdAt: -1 });

// Virtual for checking if has response
testimonialSchema.virtual('hasResponse').get(function() {
  return !!(this.response && this.response.content);
});

module.exports = mongoose.model('Testimonial', testimonialSchema);
