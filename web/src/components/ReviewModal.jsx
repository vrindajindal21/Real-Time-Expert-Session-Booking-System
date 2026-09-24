import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { buildUrl, API_ENDPOINTS, REQUEST_CONFIG } from '../config/api';

/**
 * ReviewModal — lets a user submit a star rating + written review for a completed booking
 *
 * Props:
 *   open      {boolean}
 *   booking   {object}  the booking object (for bookingId, expertName, serviceTitle)
 *   onClose   {function}
 *   onSuccess {function} called after successful submission
 */
const ReviewModal = ({ open, booking, onClose, onSuccess }) => {
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        buildUrl(API_ENDPOINTS.REVIEWS?.CREATE || '/api/reviews'),
        { bookingId: booking?._id, rating, comment: review },
        { headers: REQUEST_CONFIG.addAuthHeader(token) }
      );
      toast.success('Review submitted! Thank you 🙏');
      onSuccess?.();
      onClose();
      setRating(0);
      setReview('');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Failed to submit review';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const starLabels = ['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'];

  return (
    <AnimatePresence>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9000
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 12 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '460px', maxWidth: '92vw',
              background: 'white', borderRadius: '28px',
              padding: '36px', boxShadow: '0 40px 100px rgba(0,0,0,0.25)',
              display: 'flex', flexDirection: 'column', gap: '24px'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: '#0f172a' }}>
                  Leave a Review
                </h2>
                {booking && (
                  <p style={{ margin: '6px 0 0', fontSize: '0.85rem', color: '#64748b' }}>
                    {booking.serviceTitle} · {booking.customerName || 'Session'}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
              >
                <X size={22} />
              </button>
            </div>

            {/* Stars */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '8px' }}>
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer',
                      padding: '4px', transition: 'transform 0.15s'
                    }}
                  >
                    <Star
                      size={36}
                      fill={(hoveredStar || rating) >= star ? '#f59e0b' : 'none'}
                      color={(hoveredStar || rating) >= star ? '#f59e0b' : '#cbd5e1'}
                      style={{
                        transform: (hoveredStar || rating) >= star ? 'scale(1.15)' : 'scale(1)',
                        transition: 'transform 0.15s'
                      }}
                    />
                  </button>
                ))}
              </div>
              {(hoveredStar || rating) > 0 && (
                <p style={{
                  margin: 0, fontSize: '0.85rem', fontWeight: 700,
                  color: '#f59e0b', letterSpacing: '0.02em'
                }}>
                  {starLabels[hoveredStar || rating]}
                </p>
              )}
            </div>

            {/* Comment */}
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                  Your Experience (optional)
                </label>
                <textarea
                  rows={4}
                  value={review}
                  onChange={e => setReview(e.target.value)}
                  placeholder="Share what you liked or what could be improved..."
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    border: '2px solid #e2e8f0', borderRadius: '16px',
                    padding: '14px 16px', fontFamily: 'inherit',
                    fontSize: '0.9rem', resize: 'none', color: '#0f172a',
                    outline: 'none', transition: 'border-color 0.2s'
                  }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    flex: 1, padding: '13px', borderRadius: '14px',
                    border: '2px solid #e2e8f0', background: 'none',
                    fontWeight: 700, cursor: 'pointer', color: '#64748b'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || rating === 0}
                  style={{
                    flex: 2, padding: '13px', borderRadius: '14px',
                    border: 'none',
                    background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                    color: 'white', fontWeight: 800, cursor: submitting ? 'not-allowed' : 'pointer',
                    opacity: (submitting || rating === 0) ? 0.6 : 1,
                    transition: 'opacity 0.2s'
                  }}
                >
                  {submitting ? 'Submitting...' : '✨ Submit Review'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal;
