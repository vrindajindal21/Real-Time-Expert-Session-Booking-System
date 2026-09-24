const express = require('express');
const router = express.Router();
const { protect, companyMember } = require('../middleware/authMiddleware');
const {
  createNote, getClientNotes, getBookingNotes, updateNote, deleteNote
} = require('../controllers/clientNoteController');

router.post('/', protect, companyMember, createNote);
router.get('/client/:clientId', protect, companyMember, getClientNotes);
router.get('/booking/:bookingId', protect, getBookingNotes);
router.patch('/:id', protect, updateNote);
router.delete('/:id', protect, deleteNote);

module.exports = router;
