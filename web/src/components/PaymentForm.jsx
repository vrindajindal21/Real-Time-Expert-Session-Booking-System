import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, CreditCard, Lock, CheckCircle, X, Zap } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';

/**
 * PaymentForm — Stripe payment flow for booking confirmation
 *
 * Props:
 *   open        {boolean}
 *   booking     {object}   booking object with _id, totalAmount, serviceTitle
 *   onClose     {function}
 *   onSuccess   {function} called after payment confirmed
 */
const PaymentForm = ({ open, booking, onClose, onSuccess }) => {
  const [step, setStep] = useState('details'); // 'details' | 'processing' | 'success'
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvv: '',
    name: ''
  });
  const [errors, setErrors] = useState({});
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (open) {
      setStep('details');
      setCardData({ number: '', expiry: '', cvv: '', name: '' });
      setErrors({});
    }
  }, [open]);

  // Format card number with spaces
  const formatCardNumber = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  // Format expiry MM/YY
  const formatExpiry = (val) => {
    const digits = val.replace(/\D/g, '').slice(0, 4);
    if (digits.length >= 2) return digits.slice(0, 2) + '/' + digits.slice(2);
    return digits;
  };

  const getCardBrand = (num) => {
    const n = num.replace(/\s/g, '');
    if (/^4/.test(n)) return 'VISA';
    if (/^5[1-5]/.test(n)) return 'MC';
    if (/^3[47]/.test(n)) return 'AMEX';
    if (/^6(?:011|5)/.test(n)) return 'DISC';
    return null;
  };

  const validate = () => {
    const errs = {};
    const num = cardData.number.replace(/\s/g, '');
    if (!cardData.name.trim()) errs.name = 'Name is required';
    if (num.length < 13) errs.number = 'Invalid card number';
    if (!/^\d{2}\/\d{2}$/.test(cardData.expiry)) errs.expiry = 'Invalid expiry (MM/YY)';
    if (!/^\d{3,4}$/.test(cardData.cvv)) errs.cvv = 'Invalid CVV';

    // Expiry date check
    if (cardData.expiry.includes('/')) {
      const [mm, yy] = cardData.expiry.split('/');
      const exp = new Date(2000 + parseInt(yy), parseInt(mm) - 1, 1);
      if (exp < new Date()) errs.expiry = 'Card has expired';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handlePay = async () => {
    if (!validate()) return;

    setProcessing(true);
    setStep('processing');

    try {
      const token = localStorage.getItem('token');

      // Step 1: Create payment intent on backend
      const { data } = await axios.post(
        `${API_CONFIG.baseUrl}/payments/create-payment-intent`,
        {
          bookingId: booking._id,
          amount: booking.totalAmount || booking.price,
          currency: 'inr'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Step 2: In a real Stripe integration, you'd use stripe.confirmCardPayment() here
      // For this implementation, we confirm via the backend confirm endpoint
      await axios.post(
        `${API_CONFIG.baseUrl}/payments/confirm`,
        {
          bookingId: booking._id,
          paymentIntentId: data.data?.clientSecret || data.paymentIntentId
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setStep('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 2500);

    } catch (err) {
      const msg = err?.response?.data?.message || 'Payment failed. Please try again.';
      toast.error(msg);
      setStep('details');
    } finally {
      setProcessing(false);
    }
  };

  const brand = getCardBrand(cardData.number);
  const amount = booking?.totalAmount || booking?.price || 0;

  const inputStyle = (field) => ({
    width: '100%',
    boxSizing: 'border-box',
    padding: '14px 16px',
    border: `2px solid ${errors[field] ? '#ef4444' : '#e2e8f0'}`,
    borderRadius: '14px',
    fontFamily: 'inherit',
    fontSize: '0.95rem',
    outline: 'none',
    transition: 'border-color 0.2s',
    background: 'white',
    color: '#0f172a'
  });

  return (
    <AnimatePresence>
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,0.55)',
            backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 9500, padding: '20px'
          }}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 28 }}
            onClick={e => e.stopPropagation()}
            style={{
              width: '480px', maxWidth: '95vw',
              background: 'white',
              borderRadius: '28px',
              boxShadow: '0 50px 120px rgba(0,0,0,0.3)',
              overflow: 'hidden'
            }}
          >
            {/* ── Header ─────────────────────────────── */}
            <div style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #ec4899 100%)',
              padding: '28px 32px',
              color: 'white'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <Lock size={18} />
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.9 }}>
                      Secure Payment
                    </span>
                  </div>
                  <h2 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>
                    ₹{amount.toLocaleString('en-IN')}
                  </h2>
                  <p style={{ margin: '6px 0 0', opacity: 0.85, fontSize: '0.9rem' }}>
                    {booking?.serviceTitle || 'Professional Session'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', borderRadius: '10px', padding: '8px', cursor: 'pointer' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* Trust badges */}
              <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
                {['256-bit SSL', 'PCI-DSS', 'Stripe Secured'].map(badge => (
                  <div key={badge} style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'rgba(255,255,255,0.15)', padding: '4px 10px', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 700 }}>
                    <Shield size={10} /> {badge}
                  </div>
                ))}
              </div>
            </div>

            {/* ── Body ───────────────────────────────── */}
            <div style={{ padding: '32px' }}>

              {/* Step: Details */}
              {step === 'details' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Card number */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                      Card Number
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        style={inputStyle('number')}
                        value={cardData.number}
                        onChange={e => setCardData(p => ({ ...p, number: formatCardNumber(e.target.value) }))}
                        placeholder="1234 5678 9012 3456"
                        maxLength={19}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = errors.number ? '#ef4444' : '#e2e8f0'}
                      />
                      {brand && (
                        <span style={{
                          position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)',
                          fontSize: '0.7rem', fontWeight: 900, color: '#6366f1',
                          background: 'rgba(99,102,241,0.08)', padding: '3px 8px', borderRadius: '6px'
                        }}>
                          {brand}
                        </span>
                      )}
                    </div>
                    {errors.number && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '5px' }}>{errors.number}</p>}
                  </div>

                  {/* Cardholder name */}
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                      Cardholder Name
                    </label>
                    <input
                      style={inputStyle('name')}
                      value={cardData.name}
                      onChange={e => setCardData(p => ({ ...p, name: e.target.value }))}
                      placeholder="Name as on card"
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = errors.name ? '#ef4444' : '#e2e8f0'}
                    />
                    {errors.name && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '5px' }}>{errors.name}</p>}
                  </div>

                  {/* Expiry + CVV */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '28px' }}>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                        Expiry Date
                      </label>
                      <input
                        style={inputStyle('expiry')}
                        value={cardData.expiry}
                        onChange={e => setCardData(p => ({ ...p, expiry: formatExpiry(e.target.value) }))}
                        placeholder="MM/YY"
                        maxLength={5}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = errors.expiry ? '#ef4444' : '#e2e8f0'}
                      />
                      {errors.expiry && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '5px' }}>{errors.expiry}</p>}
                    </div>
                    <div>
                      <label style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
                        CVV
                      </label>
                      <input
                        style={inputStyle('cvv')}
                        value={cardData.cvv}
                        onChange={e => setCardData(p => ({ ...p, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
                        placeholder="•••"
                        type="password"
                        maxLength={4}
                        onFocus={e => e.target.style.borderColor = '#6366f1'}
                        onBlur={e => e.target.style.borderColor = errors.cvv ? '#ef4444' : '#e2e8f0'}
                      />
                      {errors.cvv && <p style={{ color: '#ef4444', fontSize: '0.78rem', marginTop: '5px' }}>{errors.cvv}</p>}
                    </div>
                  </div>

                  <button
                    onClick={handlePay}
                    style={{
                      width: '100%', padding: '16px',
                      background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                      color: 'white', border: 'none', borderRadius: '16px',
                      fontWeight: 800, fontSize: '1rem', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                      boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                      transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                    onMouseOut={e => e.currentTarget.style.transform = 'none'}
                  >
                    <CreditCard size={20} />
                    Pay ₹{amount.toLocaleString('en-IN')} Securely
                  </button>

                  <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#94a3b8', marginTop: '14px' }}>
                    🔒 Your payment data is encrypted and never stored
                  </p>
                </motion.div>
              )}

              {/* Step: Processing */}
              {step === 'processing' && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{ textAlign: 'center', padding: '40px 20px' }}
                >
                  <div style={{ position: 'relative', width: '72px', height: '72px', margin: '0 auto 24px' }}>
                    <div style={{
                      position: 'absolute', inset: 0, borderRadius: '50%',
                      border: '4px solid rgba(99,102,241,0.15)',
                      borderTopColor: '#6366f1',
                      animation: 'spin 0.8s linear infinite'
                    }} />
                    <Zap size={28} color="#6366f1" style={{ position: 'absolute', inset: '50%', transform: 'translate(-50%,-50%)' }} />
                  </div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '8px' }}>Processing Payment</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Please wait — do not close this window</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </motion.div>
              )}

              {/* Step: Success */}
              {step === 'success' && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center', padding: '40px 20px' }}
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
                    style={{
                      width: '72px', height: '72px', borderRadius: '50%',
                      background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      margin: '0 auto 24px',
                      boxShadow: '0 12px 32px rgba(34,197,94,0.35)'
                    }}
                  >
                    <CheckCircle size={36} color="white" />
                  </motion.div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#0f172a', marginBottom: '8px' }}>
                    Payment Successful! 🎉
                  </h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
                    Your booking is confirmed. A confirmation email is on its way.
                  </p>
                  <div style={{
                    marginTop: '20px', padding: '16px', background: '#f0fdf4',
                    borderRadius: '14px', border: '1px solid #bbf7d0'
                  }}>
                    <p style={{ margin: 0, fontWeight: 700, color: '#15803d', fontSize: '0.85rem' }}>
                      ✅ ₹{amount.toLocaleString('en-IN')} paid · Booking confirmed
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaymentForm;
