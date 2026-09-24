const mongoose = require('mongoose');

/**
 * ClientNote — CRM-grade client notes attached to a booking or a customer.
 * KPMG, Deloitte, law firms, and healthcare providers need to record context
 * about each client interaction — intake notes, session summaries, follow-up actions.
 */
const clientNoteSchema = new mongoose.Schema({
  // Who created the note
  authorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert'
  },

  // Who the note is about
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  clientName: { type: String, trim: true },

  // The booking this note relates to (optional — can be a general client note)
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },

  // Note content
  noteType: {
    type: String,
    enum: ['intake', 'session_summary', 'follow_up', 'medical', 'legal', 'financial', 'general', 'alert'],
    default: 'general'
  },
  title: { type: String, trim: true, maxlength: 200 },
  content: {
    type: String,
    required: [true, 'Note content is required'],
    trim: true,
    maxlength: 10000
  },

  // Tags for filtering (e.g. 'sensitive', 'urgent', 'completed')
  tags: [{ type: String, trim: true, lowercase: true }],

  // Visibility
  isPrivate: { type: Boolean, default: false },   // Only author can see
  isAlert: { type: Boolean, default: false },       // Shows as red alert on client card
  isPinned: { type: Boolean, default: false },

  // Attachments (Cloudinary URLs)
  attachments: [{
    url: String,
    name: String,
    mimeType: String,
    uploadedAt: { type: Date, default: Date.now }
  }],

  // Soft delete
  isDeleted: { type: Boolean, default: false }

}, { timestamps: true });

// Indexes
clientNoteSchema.index({ clientId: 1, companyId: 1, createdAt: -1 });
clientNoteSchema.index({ bookingId: 1 });
clientNoteSchema.index({ authorId: 1 });
clientNoteSchema.index({ isAlert: 1, companyId: 1 });
clientNoteSchema.index({ tags: 1, companyId: 1 });

module.exports = mongoose.model('ClientNote', clientNoteSchema);
