const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking',
    required: true,
    unique: true // One review per booking
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  }
}, {
  timestamps: true
});

// Post-save middleware to update expert's average rating
reviewSchema.post('save', async function() {
  const Review = this.constructor;
  const stats = await Review.aggregate([
    { $match: { expertId: this.expertId } },
    { $group: { _id: '$expertId', nRating: { $sum: 1 }, avgRating: { $avg: '$rating' } } }
  ]);

  if (stats.length > 0) {
    await mongoose.model('Expert').findByIdAndUpdate(this.expertId, {
      rating: Math.round(stats[0].avgRating * 10) / 10 // Round to 1 decimal
    });
  }
});

module.exports = mongoose.model('Review', reviewSchema);
