const express = require('express');
const router = express.Router();
const { protect, companyOwner } = require('../middleware/authMiddleware');
const {
  generateInvoice,
  getCompanyInvoices,
  getMyInvoices,
  getInvoice,
  markInvoicePaid,
  cancelInvoice
} = require('../controllers/invoiceController');

router.post('/generate', protect, generateInvoice);
router.get('/company', protect, companyOwner, getCompanyInvoices);
router.get('/mine', protect, getMyInvoices);
router.get('/:id', protect, getInvoice);
router.patch('/:id/mark-paid', protect, companyOwner, markInvoicePaid);
router.patch('/:id/cancel', protect, companyOwner, cancelInvoice);

module.exports = router;
