const mongoose = require('mongoose');

const favoriteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User is required']
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: [true, 'Service is required']
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: [true, 'Company is required']
  }
}, {
  timestamps: true
});

// Compound index to prevent duplicates
favoriteSchema.index({ userId: 1, serviceId: 1 }, { unique: true });

// Index for user's favorites
favoriteSchema.index({ userId: 1, createdAt: -1 });

// Index for service popularity
favoriteSchema.index({ serviceId: 1 });

module.exports = mongoose.model('Favorite', favoriteSchema);
