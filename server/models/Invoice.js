const mongoose = require('mongoose');

/**
 * Invoice — professional invoicing for every completed session.
 * Supports GST for India, custom line items, and PDF generation.
 * Essential for KPMG, Deloitte, law firms, healthcare providers, and any business
 * that needs audit-grade financial records.
 */
const invoiceSchema = new mongoose.Schema({
  // Invoice identifier
  invoiceNumber: {
    type: String,
    unique: true,
    required: true
    // Format: INV-{YEAR}-{5-digit-seq} e.g. INV-2026-00042
  },

  // Relationships
  companyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company'
  },
  expertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Expert'
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Booking'
  },
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Provider details (snapshot at invoice time)
  providerDetails: {
    name: String,
    email: String,
    phone: String,
    address: String,
    gstin: String,     // GST registration for India
    pan: String        // PAN for India
  },

  // Client details (snapshot)
  clientDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    address: String,
    gstin: String,
    companyName: String
  },

  // Line items
  lineItems: [{
    description: { type: String, required: true },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, required: true },
    discount: { type: Number, default: 0 },      // Percentage
    taxRate: { type: Number, default: 18 },       // GST % in India
    amount: { type: Number, required: true }      // Final line amount after discount+tax
  }],

  // Totals
  subtotal: { type: Number, required: true },
  discountTotal: { type: Number, default: 0 },
  taxTotal: { type: Number, default: 0 },
  totalAmount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },

  // Tax breakdown for GST compliance
  taxBreakdown: {
    cgst: { type: Number, default: 0 },   // Central GST (India)
    sgst: { type: Number, default: 0 },   // State GST (India)
    igst: { type: Number, default: 0 }    // Integrated GST (interstate)
  },

  // Payment status
  status: {
    type: String,
    enum: ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded'],
    default: 'draft'
  },
  paymentMethod: {
    type: String,
    enum: ['stripe', 'bank_transfer', 'upi', 'cash', 'cheque', 'other']
  },
  paidAt: Date,
  paymentReference: String, // Transaction ID or reference

  // Dates
  issueDate: { type: Date, default: Date.now },
  dueDate: Date,

  // PDF storage
  pdfUrl: String,       // Cloudinary or S3 URL

  // Notes
  notes: { type: String, trim: true, maxlength: 2000 },
  termsAndConditions: { type: String, trim: true },

  // Audit
  sentAt: Date,
  viewedAt: Date,
  remindersSent: { type: Number, default: 0 }

}, { timestamps: true });

// Auto-generate invoice number before save
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('Invoice').countDocuments({
      invoiceNumber: new RegExp(`^INV-${year}-`)
    });
    this.invoiceNumber = `INV-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

// Indexes
invoiceSchema.index({ customerId: 1, status: 1 });
invoiceSchema.index({ companyId: 1, status: 1 });
invoiceSchema.index({ bookingId: 1 });
invoiceSchema.index({ status: 1, dueDate: 1 }); // For overdue detection
invoiceSchema.index({ issueDate: -1 });

module.exports = mongoose.model('Invoice', invoiceSchema);
