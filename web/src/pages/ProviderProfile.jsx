import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Calendar, Clock, Star, ShieldCheck, Users, ArrowLeft, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import ChatWindow from '../components/ChatWindow';
import PaymentForm from '../components/PaymentForm';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';
import { MOCK_EXPERTS } from '../data/mockData';

const ProviderProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [provider, setProvider] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [staff, setStaff] = useState([]);

  useEffect(() => {
    fetchProvider();
  }, [id]);

  useEffect(() => {
    if (provider?.services?.length > 0) {
      setSelectedService(provider.services[0]);
    }
  }, [provider]);

  const fetchProvider = async () => {
    try {
      const { data } = await axios.get(`${API_CONFIG.baseUrl}/experts/${id}`);
      setProvider(data);
      
      // Fetch Staff
      const staffRes = await axios.get(`${API_CONFIG.baseUrl}/experts/${data._id}/staff`);
      setStaff(staffRes.data);
    } catch (err) {
      console.warn('Backend offline, loading mock provider');
      const found = MOCK_EXPERTS.find(e => e._id === id) || MOCK_EXPERTS[0];
      setProvider(found);
      setStaff([]);
    } finally {
      setLoading(false);
    }
  };

  const [payBooking, setPayBooking] = useState(null);
  const [processing, setProcessing] = useState(false);

  const handleBooking = async () => {
    if (!selectedSlot) return toast.error('Please select a time slot');
    
    setProcessing(true);
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.post(`${API_CONFIG.baseUrl}/bookings`, 
        { 
          expertId: provider._id, 
          slotId: selectedSlot.slotId,
          serviceId: selectedService?._id,
          date: selectedSlot.date,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const newBooking = data.booking;
      
      if (newBooking.paymentStatus === 'Pending') {
        // Needs payment
        setPayBooking(newBooking);
      } else {
        // Free booking
        toast.success('Booking confirmed successfully!');
        setBookingSuccess(true);
        setTimeout(() => navigate('/dashboard'), 1500);
      }
    } catch (err) {
      // LocalStorage fallback for frontend-only presentation
      console.warn('Saving booking to LocalStorage fallback');
      const localBooking = {
        _id: 'bk_' + Date.now(),
        expertId: provider._id,
        expertName: provider.name,
        serviceName: selectedService?.name || 'Consultation Session',
        date: selectedSlot.date,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        status: 'Confirmed',
        createdAt: new Date().toISOString()
      };
      const existing = JSON.parse(localStorage.getItem('local_bookings') || '[]');
      localStorage.setItem('local_bookings', JSON.stringify([localBooking, ...existing]));
      toast.success('Booking confirmed successfully!');
      setBookingSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="loading-screen">Loading Profile...</div>;
  if (!provider) return <div className="error-screen">Provider not found</div>;

  return (
    <div className="profile-container">
      <button onClick={() => navigate(-1)} className="back-btn"><ArrowLeft size={18} /> Back</button>

      {bookingSuccess ? (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="success-overlay glass">
          <CheckCircle size={80} color="#22c55e" />
          <h2>Booking Confirmed!</h2>
          <p>Redirecting to your dashboard...</p>
        </motion.div>
      ) : (
        <div className="profile-grid">
          {/* Main Info */}
          <div className="profile-main">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="info-card glass">
              <div className="badge-row">
                <span className="category-tag">{provider.category}</span>
                {provider.isApproved && <span className="verified-tag"><ShieldCheck size={14} /> Verified</span>}
              </div>
              <h1>{provider.name}</h1>
              {provider.companyName && <h3 className="company-subtitle">{provider.companyName}</h3>}
              
              <div className="stats-strip">
                <div className="stat-pill"><Star size={16} fill="#fbbf24" color="#fbbf24" /> {provider.rating} Rating</div>
                <div className="stat-pill"><Users size={16} /> {provider.experience}+ Years</div>
              </div>

              <div className="marketplace-details glass">
                <div className="detail-item">
                  <span className="label">Session Mode</span>
                  <span className="value">{provider.sessionType}</span>
                </div>
                {provider.location && (
                  <div className="detail-item">
                    <span className="label">Location</span>
                    <span className="value">{provider.location}</span>
                  </div>
                )}
                {provider.customFields && Object.entries(provider.customFields).map(([key, value]) => (
                  <div key={key} className="detail-item">
                    <span className="label">{key}</span>
                    <span className="value">{value}</span>
                  </div>
                ))}
              </div>

              <div className="bio-section">
                <h4>About</h4>
                <p>{provider.bio}</p>
              </div>

              <div className="actions-row">
                <button onClick={() => setShowChat(!showChat)} className="btn btn-outline">
                  <MessageSquare size={18} /> Send Message
                </button>
              </div>
            </motion.div>

            {/* Team Section (Any type can have staff now for flexibility) */}
            {staff.length > 0 && (
               <div className="team-section">
                 <h3>Professional Team & Specialists</h3>
                 <div className="team-grid">
                   {staff.map(member => (
                     <div key={member._id} className="team-member glass">
                        <div className="avatar">{member.name[0]}</div>
                        <div>
                          <p className="team-name">{member.name}</p>
                          <p className="team-role">{member.role} • {member.experience || 0} Yrs Exp.</p>
                          <div className="member-tags">
                            {member.specialization.map((s, i) => <span key={i} className="m-tag">{s}</span>)}
                          </div>
                        </div>
                     </div>
                   ))}
                 </div>
               </div>
            )}
          </div>

          {/* Booking Sidebar */}
          <div className="booking-sidebar">
            <div className="booking-card glass">
              <h3><Calendar size={20} /> Select Service & Time</h3>
              
              <div className="service-menu">
                <p className="section-label">1. Choose a Service</p>
                <div className="service-list">
                  {provider.services?.map(s => {
                    const isServiceSelected = selectedService?._id === (s._id?.$oid || s._id);
                    return (
                      <button 
                        key={s._id} 
                        type="button"
                        className={`service-btn ${isServiceSelected ? 'active' : ''}`}
                        onClick={() => setSelectedService(s)}
                      >
                        <div className="s-info">
                          <div className="s-header">
                            <p className="s-title">{s.title}</p>
                            {s.type !== 'Session' && <span className="s-type-tag">{s.type}</span>}
                          </div>
                          <p className="s-duration">{s.duration} mins</p>
                        </div>
                        <span className="s-price">₹{s.price}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="slots-section">
                <p className="section-label">2. Select an Available Slot</p>
                <div className="slots-grid">
                  {Object.keys(provider.groupedTimeSlots || {}).map(date => (
                    <div key={date} className="date-group">
                      <p className="date-label">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                      <div className="time-chips">
                        {provider.groupedTimeSlots[date].map(slot => {
                          const isSelected = selectedSlot?.slotId === (slot._id?.$oid || slot._id);
                          return (
                            <button 
                              key={slot._id}
                              type="button"
                              disabled={slot.isBooked}
                              className={`time-chip ${isSelected ? 'selected' : ''} ${slot.isBooked ? 'booked' : ''}`}
                              onClick={() => setSelectedSlot({
                                slotId: slot._id?.$oid || slot._id,
                                date: date,
                                startTime: slot.startTime,
                                endTime: slot.endTime
                              })}
                            >
                              {slot.startTime}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="booking-footer">
                <div className="price-info">
                  <div className="final-selection">
                    <p className="p-muted">{selectedService?.title || 'Select Service'}</p>
                    <span className="price">₹{selectedService?.price || 0}</span>
                  </div>
                </div>
                <button 
                  disabled={!selectedSlot || !selectedService} 
                  onClick={handleBooking}
                  className="btn btn-primary w-full"
                >
                  Pay ₹{selectedService?.price || 0} & Book Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <PaymentForm
        open={!!payBooking}
        booking={payBooking}
        onClose={() => setPayBooking(null)}
        onSuccess={() => {
          setPayBooking(null);
          toast.success('Payment successful & Booking confirmed!');
          setBookingSuccess(true);
          setTimeout(() => navigate('/dashboard'), 2000);
        }}
      />

      {showChat && (
        <ChatWindow 
          receiverId={provider.userId} 
          receiverName={provider.name} 
          onClose={() => setShowChat(false)} 
        />
      )}

      <style jsx>{`
        .profile-container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        .back-btn { background: none; border: none; display: flex; align-items: center; gap: 8px; color: var(--text-muted); cursor: pointer; margin-bottom: 24px; font-weight: 600; }
        .profile-grid { display: grid; grid-template-columns: 1.5fr 1fr; gap: 40px; }
        .info-card { padding: 40px; border-radius: 32px; }
        .badge-row { display: flex; gap: 12px; margin-bottom: 20px; }
        .category-tag { background: var(--bg); padding: 6px 16px; border-radius: 100px; font-weight: 700; font-size: 0.85rem; color: var(--primary); }
        .verified-tag { display: flex; align-items: center; gap: 6px; background: #dcfce7; color: #16a34a; padding: 6px 16px; border-radius: 100px; font-weight: 700; font-size: 0.85rem; }
        .info-card h1 { font-size: 3rem; margin-bottom: 8px; }
        .company-subtitle { color: var(--text-muted); font-weight: 500; margin-bottom: 24px; }
        .stats-strip { display: flex; gap: 24px; margin-bottom: 32px; }
        .stat-pill { display: flex; align-items: center; gap: 8px; font-weight: 600; color: var(--text-muted); }
        .bio-section h4 { margin-bottom: 12px; font-size: 1.1rem; }
        .bio-section p { line-height: 1.8; color: var(--text-muted); margin-bottom: 32px; }
        
        .booking-card { padding: 32px; border-radius: 32px; position: sticky; top: 100px; }
        .booking-card h3 { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        .p-muted { color: var(--text-muted); font-size: 0.9rem; }
        .section-label { font-weight: 700; font-size: 0.8rem; text-transform: uppercase; color: var(--primary); margin-bottom: 12px; letter-spacing: 0.05em; }
        
        .service-menu { margin: 24px 0; }
        .service-list { display: flex; flex-direction: column; gap: 10px; }
        .service-btn { display: flex; justify-content: space-between; align-items: center; padding: 12px 20px; border-radius: 16px; border: 1px solid var(--glass-border); background: var(--bg); cursor: pointer; text-align: left; transition: all 0.2s; }
        .service-btn.active { border-color: var(--primary); background: rgba(99, 102, 241, 0.05); }
        .service-btn:hover:not(.active) { border-color: var(--primary); }
        .s-title { font-weight: 700; margin-bottom: 2px; }
        .s-duration { font-size: 0.8rem; color: var(--text-muted); }
        .s-price { font-weight: 800; color: var(--primary); }

        .slots-section { margin: 24px 0; border-top: 1px solid var(--glass-border); padding-top: 24px; }
        .slots-grid { max-height: 250px; overflow-y: auto; padding-right: 10px; }
        .date-label { font-weight: 700; margin-bottom: 12px; font-size: 0.95rem; }
        .time-chips { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; margin-bottom: 24px; }
        .time-chip { padding: 10px 0; border: 1px solid var(--glass-border); border-radius: 12px; background: var(--bg); font-weight: 600; cursor: pointer; transition: all 0.2s; }
        .time-chip.selected { background: var(--primary); color: white; border-color: var(--primary); }
        .time-chip.booked { opacity: 0.5; cursor: not-allowed; text-decoration: line-through; }
        .booking-footer { border-top: 1px solid var(--glass-border); padding-top: 24px; }
        .price-info { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .price { font-size: 1.5rem; font-weight: 800; }
        .w-full { width: 100%; justify-content: center; }

        .team-section { margin-top: 40px; }
        .team-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
        .team-member { display: flex; align-items: center; gap: 16px; padding: 20px; border-radius: 20px; }
        .avatar { width: 44px; height: 44px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .team-name { font-weight: 700; }
        .team-role { font-size: 0.82rem; color: var(--text-muted); margin-bottom: 4px; }
        .member-tags { display: flex; gap: 4px; flex-wrap: wrap; }
        .m-tag { font-size: 0.65rem; background: rgba(0,0,0,0.04); padding: 1px 6px; border-radius: 4px; font-weight: 700; }

        .success-overlay { padding: 80px; text-align: center; border-radius: 40px; }
        .loading-screen { padding: 100px; text-align: center; font-size: 1.5rem; font-weight: 600; }
        

        .marketplace-details { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 20px; border-radius: 20px; margin-bottom: 32px; background: rgba(0,0,0,0.02); }
        .detail-item { display: flex; flex-direction: column; gap: 4px; }
        .detail-item .label { font-size: 0.75rem; font-weight: 700; color: var(--primary); text-transform: uppercase; }
        .detail-item .value { font-weight: 600; }
        
        .s-header { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .s-type-tag { font-size: 0.65rem; background: var(--primary); color: white; padding: 2px 8px; border-radius: 4px; font-weight: 800; text-transform: uppercase; }

        @media (max-width: 900px) { .profile-grid { grid-template-columns: 1fr; } }
      `}</style>
    </div>
  );
};

export default ProviderProfile;
