import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Calendar, Clock, Search, ChevronLeft, ChevronRight, CreditCard, Video } from 'lucide-react';
import { Link } from 'react-router-dom';
import { buildUrl, API_ENDPOINTS, REQUEST_CONFIG } from '../config/api';
import toast from 'react-hot-toast';
import ChatWindow from '../components/ChatWindow';
import ReviewModal from '../components/ReviewModal';
import ConfirmModal from '../components/ConfirmModal';
import PaymentForm from '../components/PaymentForm';
import MeetingLinkCard from '../components/MeetingLinkCard';

const PAGE_SIZE = 6;

const UserDashboard = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [time, setTime] = useState(new Date());

  // Pagination
  const [page, setPage] = useState(1);

  // Chat state
  const [chatBooking, setChatBooking] = useState(null);

  // Review modal state
  const [reviewBooking, setReviewBooking] = useState(null);

  // Cancel confirm modal state
  const [confirmCancel, setConfirmCancel] = useState(null);

  // Payment modal state
  const [payBooking, setPayBooking] = useState(null);

  // Expanded meeting link
  const [meetingBooking, setMeetingBooking] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const fetchMyBookings = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(buildUrl(API_ENDPOINTS.USER.BOOKINGS), {
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      setBookings(data.bookings || data);
    } catch (err) {
      console.warn('Backend offline, loading local bookings');
      let local = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      if (local.length === 0) {
        local = [
          {
            _id: 'bk_sample_1',
            expertName: 'Dr. Aarav Sharma',
            serviceTitle: 'Clinical Consultation',
            date: new Date().toISOString(),
            startTime: '10:00 AM',
            status: 'Confirmed',
            paymentStatus: 'Paid',
            meetingLink: 'https://meet.google.com/abc-defg-hij'
          },
          {
            _id: 'bk_sample_2',
            expertName: 'Rohan Verma',
            serviceTitle: 'Cloud Architecture Mentorship',
            date: new Date(Date.now() + 86400000).toISOString(),
            startTime: '04:00 PM',
            status: 'Pending',
            paymentStatus: 'Unpaid'
          }
        ];
        localStorage.setItem('local_bookings', JSON.stringify(local));
      }
      const formatted = local.map(b => ({
        ...b,
        expertId: typeof b.expertId === 'object' && b.expertId !== null ? b.expertId : { name: b.expertName || 'Dr. Aarav Sharma', category: b.serviceTitle || 'Healthcare' }
      }));
      setBookings(formatted);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMyBookings();
  }, [fetchMyBookings]);

  const cancelBooking = async () => {
    if (!confirmCancel) return;
    try {
      const token = localStorage.getItem('token');
      await axios.patch(
        buildUrl(API_ENDPOINTS.BOOKINGS.CANCEL, { id: confirmCancel }),
        { status: 'Cancelled' },
        { headers: REQUEST_CONFIG.addAuthHeader(token) }
      );
      toast.success('Appointment cancelled');
      setConfirmCancel(null);
      fetchMyBookings();
    } catch (err) {
      const message = REQUEST_CONFIG.handleErrorResponse(err);
      toast.error(message || 'Cancellation failed');
    }
  };

  // Paginated bookings
  const totalPages = Math.ceil(bookings.length / PAGE_SIZE);
  const pagedBookings = bookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '60px 20px' }}>

      {/* Header */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '40px', flexWrap: 'wrap', gap: '20px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--primary)', letterSpacing: '0.05em', marginBottom: '8px' }}>
            {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} •{' '}
            {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <h1 style={{ fontSize: '2.2rem', marginBottom: '4px' }}>
            {getGreeting()},{' '}
            <span className="gradient-text">{user?.name}</span>
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem' }}>
            Manage your professional sessions and appointments
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <Link to="/workspace" className="btn btn-outline" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={18} /> Open Workspace
          </Link>
          <Link to="/search" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Search size={18} /> Book Session
          </Link>
        </div>
      </header>

      {/* Stats */}
      <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '48px' }}>
        {[
          { label: 'Total Sessions', val: bookings.length },
          { label: 'Completed', val: bookings.filter(b => b.status === 'Completed').length },
          { label: 'Upcoming', val: bookings.filter(b => ['Pending', 'Confirmed'].includes(b.status)).length }
        ].map(stat => (
          <div key={stat.label} className="glass" style={{ padding: '32px 24px', borderRadius: '20px', textAlign: 'center' }}>
            <p style={{ fontSize: '2.5rem', fontWeight: 800, marginBottom: '4px', color: 'var(--text-main)' }}>{stat.val}</p>
            <p style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{stat.label}</p>
          </div>
        ))}
      </section>

      {/* Bookings List */}
      <div className="glass" style={{ padding: '40px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Your Appointments</h2>
          {totalPages > 1 && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>
              Page {page} of {totalPages} · {bookings.length} total
            </span>
          )}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
            Checking your calendar...
          </div>
        ) : bookings.length > 0 ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {pagedBookings.map((booking) => (
                <motion.div
                  key={booking._id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    flexWrap: 'wrap', gap: '16px',
                    padding: '20px', background: 'rgba(255,255,255,0.4)',
                    border: '1px solid var(--glass-border)', borderRadius: '16px',
                    transition: 'all 0.2s'
                  }}
                  whileHover={{ scale: 1.005, backgroundColor: 'white', boxShadow: 'var(--shadow)' }}
                >
                  {/* Expert info */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flex: '2', minWidth: '180px' }}>
                    <div style={{
                      width: '44px', height: '44px', background: 'var(--primary)',
                      color: 'white', borderRadius: '12px', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', fontWeight: 700, flexShrink: 0
                    }}>
                      {booking.expertId?.name?.[0] || 'U'}
                    </div>
                    <div>
                      <p style={{ fontWeight: 700, margin: 0, fontSize: '1rem' }}>{booking.expertId?.name || 'Unknown Provider'}</p>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{booking.serviceTitle || booking.expertId?.category || 'General'}</p>
                    </div>
                  </div>

                  {/* Date / time */}
                  <div style={{ display: 'flex', gap: '10px', flex: '2', minWidth: '180px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg, #f8fafc)', borderRadius: '100px', fontSize: '0.82rem', fontWeight: 600 }}>
                      <Calendar size={13} /> {new Date(booking.date).toLocaleDateString()}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', background: 'var(--bg, #f8fafc)', borderRadius: '100px', fontSize: '0.82rem', fontWeight: 600 }}>
                      <Clock size={13} /> {booking.startTime}
                    </span>
                  </div>

                  {/* Status */}
                  <span style={{
                    padding: '6px 14px', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 700,
                    ...(booking.status === 'Pending' ? { background: '#fef3c7', color: '#d97706' }
                      : booking.status === 'Confirmed' ? { background: '#dcfce7', color: '#15803d' }
                      : booking.status === 'Completed' ? { background: '#e0f2fe', color: '#0369a1' }
                      : { background: '#fee2e2', color: '#dc2626' })
                  }}>
                    {booking.status}
                  </span>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {['Pending', 'Confirmed'].includes(booking.status) && (
                      <>
                        {/* Pay button for unpaid bookings */}
                        {booking.paymentStatus !== 'Paid' && (
                          <button
                            style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '10px', background: 'linear-gradient(135deg,#22c55e,#16a34a)', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => setPayBooking(booking)}
                          >
                            <CreditCard size={14} /> Pay Now
                          </button>
                        )}
                        {/* Join meeting button */}
                        {booking.meetingLink && (
                          <button
                            style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '10px', background: '#0ea5e9', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px' }}
                            onClick={() => setMeetingBooking(booking)}
                          >
                            <Video size={14} /> Join
                          </button>
                        )}
                        <button
                          className="btn btn-primary"
                          style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                          onClick={() => setChatBooking(booking)}
                        >
                          Chat
                        </button>
                        <button
                          style={{ padding: '8px 14px', fontSize: '0.82rem', borderRadius: '10px', background: 'transparent', border: '1px solid var(--glass-border)', color: '#ef4444', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => setConfirmCancel(booking._id)}
                        >
                          Cancel
                        </button>
                      </>
                    )}
                    {booking.status === 'Completed' && (
                      <button
                        className="btn"
                        style={{ padding: '8px 14px', fontSize: '0.82rem', background: '#0369a1', color: 'white', border: 'none', borderRadius: '10px', cursor: 'pointer', fontWeight: 700 }}
                        onClick={() => setReviewBooking(booking)}
                      >
                        ⭐ Review
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '12px', marginTop: '32px' }}>
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                    background: 'none', cursor: page === 1 ? 'not-allowed' : 'pointer',
                    opacity: page === 1 ? 0.4 : 1, fontWeight: 700, fontSize: '0.85rem'
                  }}
                >
                  <ChevronLeft size={16} /> Prev
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    style={{
                      width: '36px', height: '36px', borderRadius: '10px', border: 'none',
                      background: p === page ? 'var(--primary)' : 'transparent',
                      color: p === page ? 'white' : 'var(--text-muted)',
                      fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s'
                    }}
                  >
                    {p}
                  </button>
                ))}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    padding: '8px 16px', borderRadius: '10px', border: '1px solid var(--glass-border)',
                    background: 'none', cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    opacity: page === totalPages ? 0.4 : 1, fontWeight: 700, fontSize: '0.85rem'
                  }}
                >
                  Next <ChevronRight size={16} />
                </button>
              </div>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <p style={{ marginBottom: '16px' }}>You haven't booked any sessions yet.</p>
            <Link to="/search" style={{ color: 'var(--primary)', fontWeight: 600, textDecoration: 'underline' }}>
              Browse available experts →
            </Link>
          </div>
        )}
      </div>

      {/* ── Modals ────────────────────────────────────────────── */}

      {/* Chat Window */}
      {chatBooking && (
        <ChatWindow
          bookingId={chatBooking._id}
          receiverId={chatBooking.expertId?._id || chatBooking.expertId}
          receiverName={chatBooking.expertId?.name || 'Expert'}
          onClose={() => setChatBooking(null)}
        />
      )}

      {/* Review Modal */}
      <ReviewModal
        open={!!reviewBooking}
        booking={reviewBooking}
        onClose={() => setReviewBooking(null)}
        onSuccess={fetchMyBookings}
      />

      {/* Payment Modal */}
      <PaymentForm
        open={!!payBooking}
        booking={payBooking}
        onClose={() => setPayBooking(null)}
        onSuccess={() => { setPayBooking(null); fetchMyBookings(); }}
      />

      {/* Meeting Link Modal */}
      {meetingBooking && (
        <div
          onClick={() => setMeetingBooking(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9000, padding: '20px' }}
        >
          <div onClick={e => e.stopPropagation()} style={{ width: '480px', maxWidth: '95vw', background: 'white', borderRadius: '24px', padding: '32px', boxShadow: '0 40px 100px rgba(0,0,0,0.25)' }}>
            <MeetingLinkCard booking={meetingBooking} />
          </div>
        </div>
      )}

      {/* Cancel Confirm Modal */}
      <ConfirmModal
        open={!!confirmCancel}
        title="Cancel Appointment?"
        message="Are you sure you want to cancel this appointment? The slot will be released."
        confirmText="Yes, Cancel"
        danger
        onConfirm={cancelBooking}
        onCancel={() => setConfirmCancel(null)}
      />
    </div>
  );
};

export default UserDashboard;
