const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const Company = require('../models/Company');
const { AppError } = require('../middleware/errorMiddleware');

// @desc    Generate invoice for a booking (auto-create)
// @route   POST /api/invoices/generate
// @access  Private (company_owner, expert)
exports.generateInvoice = async (req, res, next) => {
  try {
    const { bookingId, taxRate = 18, notes, dueDate } = req.body;

    const booking = await Booking.findById(bookingId)
      .populate('customerId', 'name email phone')
      .populate('companyId', 'name description')
      .populate('serviceId', 'title description');

    if (!booking) return next(new AppError('Booking not found', 404));

    // Verify provider authorization
    let providerDetails = {};
    if (booking.companyId) {
      const company = await Company.findById(booking.companyId);
      if (!company || company.ownerId.toString() !== req.user._id.toString()) {
        // Check if staff
        const isStaff = company?.staffIds?.some(s => s.toString() === req.user._id.toString());
        if (!isStaff) return next(new AppError('Not authorized', 403));
      }
      providerDetails = {
        name: company?.name || req.user.name,
        email: req.user.email,
        phone: req.user.phone || ''
      };
    } else {
      providerDetails = {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || ''
      };
    }

    // Check if invoice already exists for this booking
    const existing = await Invoice.findOne({ bookingId, status: { $ne: 'cancelled' } });
    if (existing) {
      return res.json({ success: true, message: 'Invoice already exists', data: existing });
    }

    const subtotal = booking.price || booking.totalAmount || 0;
    const taxTotal = +(subtotal * taxRate / 100).toFixed(2);
    // GST split: CGST + SGST (intra-state) = taxRate/2 each
    const halfTax = +(taxTotal / 2).toFixed(2);
    const totalAmount = +(subtotal + taxTotal).toFixed(2);

    const invoice = await Invoice.create({
      companyId: booking.companyId,
      bookingId: booking._id,
      customerId: booking.customerId._id,
      providerDetails,
      clientDetails: {
        name: booking.customerName,
        email: booking.customerEmail,
        phone: booking.customerPhone
      },
      lineItems: [{
        description: booking.serviceTitle,
        quantity: 1,
        unitPrice: subtotal,
        discount: 0,
        taxRate,
        amount: totalAmount
      }],
      subtotal,
      taxTotal,
      totalAmount,
      taxBreakdown: { cgst: halfTax, sgst: halfTax, igst: 0 },
      currency: booking.currency || 'INR',
      status: booking.paymentStatus === 'Paid' ? 'paid' : 'sent',
      paidAt: booking.paymentStatus === 'Paid' ? new Date() : undefined,
      issueDate: new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notes
    });

    res.status(201).json({
      success: true,
      message: `Invoice ${invoice.invoiceNumber} generated`,
      data: invoice
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all invoices for a company
// @route   GET /api/invoices/company
// @access  Private (company_owner)
exports.getCompanyInvoices = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const company = await Company.findOne({ ownerId: req.user._id });
    if (!company) return next(new AppError('Company not found', 404));

    const filter = { companyId: company._id };
    if (status) filter.status = status;

    const invoices = await Invoice.find(filter)
      .populate('customerId', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Invoice.countDocuments(filter);

    // Revenue summary
    const [revenueStats] = await Invoice.aggregate([
      { $match: { companyId: company._id, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        invoices,
        pagination: { page: +page, limit: +limit, total, pages: Math.ceil(total / limit) },
        summary: {
          totalRevenue: revenueStats?.total || 0,
          paidCount: revenueStats?.count || 0,
          pendingCount: await Invoice.countDocuments({ companyId: company._id, status: 'sent' }),
          overdueCount: await Invoice.countDocuments({ companyId: company._id, status: 'overdue' })
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get invoices for a customer
// @route   GET /api/invoices/mine
// @access  Private
exports.getMyInvoices = async (req, res, next) => {
  try {
    const invoices = await Invoice.find({ customerId: req.user._id })
      .populate('companyId', 'name logo')
      .populate('bookingId', 'serviceTitle date startTime')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: invoices });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single invoice
// @route   GET /api/invoices/:id
// @access  Private
exports.getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('customerId', 'name email phone')
      .populate('companyId', 'name logo')
      .populate('bookingId', 'serviceTitle date startTime status');

    if (!invoice) return next(new AppError('Invoice not found', 404));

    // Auth: only customer or company owner/staff
    const isCustomer = invoice.customerId._id.toString() === req.user._id.toString();
    const isProvider = invoice.companyId ?
      await Company.exists({ _id: invoice.companyId, $or: [{ ownerId: req.user._id }, { staffIds: req.user._id }] }) :
      false;

    if (!isCustomer && !isProvider && req.user.role !== 'admin') {
      return next(new AppError('Not authorized', 403));
    }

    // Track first view
    if (!invoice.viewedAt && isCustomer) {
      invoice.viewedAt = new Date();
      await invoice.save();
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Mark invoice as paid manually
// @route   PATCH /api/invoices/:id/mark-paid
// @access  Private (company_owner)
exports.markInvoicePaid = async (req, res, next) => {
  try {
    const { paymentMethod = 'bank_transfer', paymentReference } = req.body;
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return next(new AppError('Invoice not found', 404));

    invoice.status = 'paid';
    invoice.paidAt = new Date();
    invoice.paymentMethod = paymentMethod;
    invoice.paymentReference = paymentReference;
    await invoice.save();

    res.json({ success: true, message: 'Invoice marked as paid', data: invoice });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel invoice
// @route   PATCH /api/invoices/:id/cancel
// @access  Private (company_owner)
exports.cancelInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id,
      { status: 'cancelled' },
      { new: true }
    );
    if (!invoice) return next(new AppError('Invoice not found', 404));
    res.json({ success: true, message: 'Invoice cancelled', data: invoice });
  } catch (error) {
    next(error);
  }
};
