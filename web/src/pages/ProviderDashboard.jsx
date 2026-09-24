import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Users, TrendingUp, DollarSign, Clock, Layout,
  Check, X, CheckCircle, BarChart2, Star, Plus, Trash2, Shield, Settings, Zap,
  Activity, PieChart, MessageSquare, MoreHorizontal, AlertTriangle, FileText, StickyNote
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';
import ConfirmModal from '../components/ConfirmModal';
import ClientNotesPanel from '../components/ClientNotesPanel';

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'team', 'schedule', 'services', 'settings'
  const [bookings, setBookings] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [stats, setStats] = useState({ total: 0, revenue: 0, pending: 0, completed: 0 });
  const [time, setTime] = useState(new Date());
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isEditingStaff, setIsEditingStaff] = useState(null);
  // Confirm modal state
  const [confirmModal, setConfirmModal] = useState({ open: false, title: '', message: '', onConfirm: null });

  const showConfirm = (title, message, onConfirm, danger = true) => {
    setConfirmModal({ open: true, title, message, onConfirm, danger });
  };
  const closeConfirm = () => setConfirmModal(prev => ({ ...prev, open: false }));

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getGreeting = () => {
    const hour = time.getHours();
    if (hour < 5 || hour > 22) return 'Good Night';
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expertProfile, setExpertProfile] = useState(null);
  const [categories, setCategories] = useState([]);

  const [showServiceModal, setShowServiceModal] = useState(false);
  const [isEditingService, setIsEditingService] = useState(null); // stores service index
  const [newStaff, setNewStaff] = useState({ name: '', role: '', specialization: '', experience: '' });
  const [newService, setNewService] = useState({ title: '', description: '', price: '', duration: '60' });
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ 
    date: '', 
    startHour: '09', 
    startMin: '00', 
    startPeriod: 'AM',
    endHour: '10', 
    endMin: '00', 
    endPeriod: 'AM' 
  });
  const [onboardingStep, setOnboardingStep] = useState(0); // 0 means not showing, 1-3 are wizard steps
  const [onboardingData, setOnboardingData] = useState({
    companyName: '',
    category: '',
    location: '',
    phone: '',
    bio: '',
    experience: '0',
    themeColor: '#6366f1',
    brandTone: 'professional'
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (expertProfile?.themeColor) {
      document.documentElement.style.setProperty('--primary', expertProfile.themeColor);
      document.documentElement.style.setProperty('--primary-hover', expertProfile.themeColor + 'dd');
      document.documentElement.style.setProperty('--brand-glow', `${expertProfile.themeColor}33`);
    } else {
      document.documentElement.style.setProperty('--primary', '#6366f1');
      document.documentElement.style.setProperty('--primary-hover', '#4f46e5');
      document.documentElement.style.setProperty('--brand-glow', 'rgba(99, 102, 241, 0.2)');
    }
  }, [expertProfile?.themeColor]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [bookRes, profileRes, catRes] = await Promise.all([
        axios.get(`${API_CONFIG.baseUrl}/bookings/host/all`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_CONFIG.baseUrl}/experts/profile`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_CONFIG.baseUrl}/categories`)
      ]);
      
      setBookings(bookRes.data.bookings);
      setStats({
        total: bookRes.data.bookings.length,
        revenue: bookRes.data.revenue,
        pending: bookRes.data.bookings.filter(b => b.status === 'Pending').length,
        completed: bookRes.data.bookings.filter(b => b.status === 'Completed').length,
      });
      setExpertProfile(profileRes.data);

      // Fetch Staff
      const staffRes = await axios.get(`${API_CONFIG.baseUrl}/experts/${profileRes.data._id}/staff`);
      setTeam(staffRes.data);
      setSlots(profileRes.data.timeSlots || []);
      setCategories(catRes.data);

      try {
        const notifRes = await axios.get(`${API_CONFIG.baseUrl}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
        setNotifications(notifRes.data.data?.notifications || []);
      } catch (err) {
        console.warn('Notifications support unavailable');
      }

      // Check if onboarding is needed
      if (!profileRes.data.location || profileRes.data.bio === 'Welcome to our professional network.') {
        setOnboardingStep(1);
        setOnboardingData({
          companyName: profileRes.data.companyName || '',
          category: profileRes.data.category || '',
          location: profileRes.data.location || '',
          phone: profileRes.data.phone || '',
          bio: profileRes.data.bio || '',
          experience: profileRes.data.experience?.toString() || '0',
          themeColor: profileRes.data.themeColor || '#6366f1',
          brandTone: profileRes.data.brandTone || 'professional'
        });
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load hub data');
    } finally {
      setLoading(false);
    }
  };

  const getChartData = () => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const trend = days.map(d => ({ name: d, revenue: 0, bookings: 0 }));
    
    bookings.forEach(b => {
      if (b.status === 'Completed') {
        const dayIdx = new Date(b.date).getDay();
        trend[dayIdx].revenue += (b.price || 0);
        trend[dayIdx].bookings += 1;
      }
    });

    const today = new Date().getDay();
    return [...trend.slice(today + 1), ...trend.slice(0, today + 1)];
  };

  const getMemberStats = (memberId) => {
    const memberBookings = bookings.filter(b => 
      (b.assignedStaffId?._id === memberId) || (b.assignedStaffId === memberId)
    );
    const completed = memberBookings.filter(b => b.status === 'Completed').length;
    const revenue = memberBookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + (b.price || 0), 0);
    return {
      total: memberBookings.length,
      completed,
      revenue,
      successRate: memberBookings.length > 0 ? Math.round((completed / memberBookings.length) * 100) : 100
    };
  };

  const handleAddStaff = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const payload = { 
        ...newStaff, 
        experience: Number(newStaff.experience) || 0,
        specialization: typeof newStaff.specialization === 'string' ? newStaff.specialization.split(',').map(s => s.trim()) : newStaff.specialization 
      };

      if (isEditingStaff) {
        // Use PUT to update in-place — preserves _id so booking references stay intact
        const { data } = await axios.put(
          `${API_CONFIG.baseUrl}/experts/me/staff/${isEditingStaff}`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTeam(prev => prev.map(s => s._id === isEditingStaff ? data : s));
        toast.success('Member updated successfully');
      } else {
        const { data } = await axios.post(
          `${API_CONFIG.baseUrl}/experts/me/staff`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTeam(prev => [...prev, data]);
        toast.success('Member added successfully');
      }
      
      setShowStaffModal(false);
      setIsEditingStaff(null);
      setNewStaff({ name: '', role: '', specialization: '', experience: '' });
    } catch (err) {
      toast.error('Failed to save staff details');
    }
  };

  const openEditStaff = (member) => {
    setNewStaff({ 
      name: member.name, 
      role: member.role, 
      experience: member.experience != null ? member.experience.toString() : '0',
      specialization: member.specialization?.join(', ') || '' 
    });
    setIsEditingStaff(member._id);
    setShowStaffModal(true);
  };

  const handleRemoveStaff = async (id) => {
    showConfirm(
      'Remove Specialist?',
      'Are you sure you want to remove this specialist? They will be marked inactive but their booking history will be preserved.',
      async () => {
        try {
          const token = localStorage.getItem('token');
          setTeam(team.filter(s => s._id !== id));
          await axios.delete(`${API_CONFIG.baseUrl}/experts/me/staff/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          toast.success('Staff removed');
          closeConfirm();
        } catch (err) {
          toast.error('Failed to remove staff');
          fetchData();
          closeConfirm();
        }
      }
    );
  };

  const handleAddSlot = async () => {
    if (!newSlot.date) return toast.error('Please select a date');
    const convertTo24h = (h, m, p) => {
      let hour = parseInt(h);
      if (p === 'PM' && hour !== 12) hour += 12;
      if (p === 'AM' && hour === 12) hour = 0;
      return `${hour.toString().padStart(2, '0')}:${m}`;
    };
    const startTime = convertTo24h(newSlot.startHour, newSlot.startMin, newSlot.startPeriod);
    const endTime = convertTo24h(newSlot.endHour, newSlot.endMin, newSlot.endPeriod);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_CONFIG.baseUrl}/experts/slots`, { date: newSlot.date, startTime, endTime }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Slot added');
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add slot');
    }
  };

  const handleDeleteSlot = async (id) => {
    showConfirm(
      'Remove Slot?',
      'Remove this availability slot? Any unbooked appointment times will be released.',
      async () => {
        try {
          const token = localStorage.getItem('token');
          setSlots(slots.filter(s => s._id !== id));
          await axios.delete(`${API_CONFIG.baseUrl}/experts/slots/${id}`, { headers: { Authorization: `Bearer ${token}` } });
          toast.success('Slot removed');
          closeConfirm();
        } catch (err) {
          toast.error('Failed to remove slot');
          fetchData();
          closeConfirm();
        }
      },
      false // not a danger action style
    );
  };

  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '';
    let [hours, minutes] = timeStr.split(':');
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    return `${hours}:${minutes} ${ampm}`;
  };

  const updateStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_CONFIG.baseUrl}/bookings/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Booking ${status.toLowerCase()}`);
      fetchData();
    } catch (err) {
      toast.error('Status update failed');
    }
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const currentServices = expertProfile?.services || [];
      
      let updatedServices;
      if (isEditingService !== null) {
        updatedServices = [...currentServices];
        updatedServices[isEditingService] = newService;
      } else {
        updatedServices = [...currentServices, newService];
      }

      await axios.put(`${API_CONFIG.baseUrl}/experts/me`, 
        { ...expertProfile, services: updatedServices }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(isEditingService !== null ? 'Service updated' : 'Service added');
      setShowServiceModal(false);
      setIsEditingService(null);
      setNewService({ title: '', description: '', price: '', duration: '60' });
      fetchData();
    } catch (err) {
      toast.error('Failed to save service');
    }
  };

  const openEditService = (svc, index) => {
    setNewService(svc);
    setIsEditingService(index);
    setShowServiceModal(true);
  };

  const handleUpdateProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_CONFIG.baseUrl}/experts/me`, expertProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Hub Settings Updated');
      fetchData();
    } catch (err) {
      toast.error('Update Failed');
    }
  };

  const handleDeleteService = async (serviceIndex) => {
    if (!window.confirm('Delete this service permanently? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('token');
      const currentServices = expertProfile?.services || [];
      const updatedServices = currentServices.filter((_, i) => i !== serviceIndex);

      // Optimistic update
      setExpertProfile({ ...expertProfile, services: updatedServices });

      await axios.put(`${API_CONFIG.baseUrl}/experts/me`, 
        { ...expertProfile, services: updatedServices }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Service removed');
    } catch (err) {
      toast.error('Failed to remove service');
      fetchData(); // Rollback if it fails
    }
  };

  const handleCompleteOnboarding = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API_CONFIG.baseUrl}/experts/me`, 
        { ...onboardingData, experience: parseInt(onboardingData.experience) || 0 }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Your portal is ready!');
      setOnboardingStep(0);
      fetchData();
    } catch (err) {
      toast.error('Could not finalize portal setup');
    }
  };

  const calculateCompleteness = () => {
    let score = 0;
    if (expertProfile?.logo) score += 10;
    if (expertProfile?.companyName && expertProfile?.companyName !== 'Private Practice') score += 15;
    if (expertProfile?.bio && expertProfile?.bio.length > 30) score += 15;
    if (expertProfile?.services?.length > 0) score += 20;
    if (team?.length > 0) score += 20;
    if (slots?.length > 0) score += 20;
    return score;
  };

  const completeness = calculateCompleteness();

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_CONFIG.baseUrl}/notifications/mark-all-read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="loading-screen">Preparing your ecosystem...</div>;

  if (onboardingStep > 0) {
    return (
      <div className="onboarding-master">
        {/* Decorative Background */}
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        
        <div className="onboarding-container">
          <div className="wizard-sidebar">
             <div className="sidebar-logo">
                <span className="s-icon">✨</span>
                <span className="s-text">BookingHub</span>
             </div>
             <div className="step-indicators">
                {[1, 2, 3].map(s => (
                  <div key={s} className={`step-dot ${onboardingStep === s ? 'active' : onboardingStep > s ? 'completed' : ''}`}>
                     <div className="dot-inner">{onboardingStep > s ? '✓' : s}</div>
                     <span>{s === 1 ? 'Identity' : s === 2 ? 'Reach' : 'Styling'}</span>
                  </div>
                ))}
             </div>
             <div className="sidebar-footer">
                <p>Establishing your professional ecosystem in seconds.</p>
             </div>
          </div>

          <div className="wizard-main">
            <AnimatePresence mode="wait">
              {onboardingStep === 1 && (
                <motion.div 
                  key="step1"
                  initial={{ x: 20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  exit={{ x: -20, opacity: 0 }}
                  className="wizard-pane"
                >
                  <div className="pane-header">
                     <span className="badge">Step 01</span>
                     <h2>Create Your Digital Identity</h2>
                     <p>This is how the world will see your brand.</p>
                  </div>

                  <div className="pane-body">
                    <div className="input-v-styled">
                       <label>Brand or Organization Name</label>
                       <input type="text" value={onboardingData.companyName} onChange={e => setOnboardingData({...onboardingData, companyName: e.target.value})} placeholder="e.g. Zen Design Studio" />
                    </div>

                    <div className="input-v-styled">
                       <label>Years of Hub Experience</label>
                       <input type="number" value={onboardingData.experience} onChange={e => setOnboardingData({...onboardingData, experience: e.target.value})} placeholder="e.g. 10" />
                    </div>

                    <div className="input-v-styled">
                       <label>Choose Your Industry</label>
                       <div className="industry-grid">
                          {categories.slice(0, 6).map(cat => (
                            <div 
                              key={cat._id} 
                              className={`industry-tile ${onboardingData.category === cat.name ? 'selected' : ''}`}
                              onClick={() => setOnboardingData({...onboardingData, category: cat.name})}
                            >
                               <div className="tile-icon">{cat.name[0]}</div>
                               <span>{cat.name}</span>
                            </div>
                          ))}
                       </div>
                    </div>

                    <div className="input-v-styled">
                       <label>Quick Professional Bio</label>
                       <textarea rows="3" value={onboardingData.bio} onChange={e => setOnboardingData({...onboardingData, bio: e.target.value})} placeholder="A short intro that wows your clients..."></textarea>
                    </div>
                  </div>
                </motion.div>
              )}

              {onboardingStep === 2 && (
                <motion.div 
                  key="step2"
                  initial={{ x: 20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  exit={{ x: -20, opacity: 0 }}
                  className="wizard-pane"
                >
                  <div className="pane-header">
                     <span className="badge">Step 02</span>
                     <h2>Connect With Clients</h2>
                     <p>Where and how can people reach your services?</p>
                  </div>

                  <div className="pane-body">
                    <div className="input-v-styled">
                       <label>Your Headquarters / Location</label>
                       <div className="location-input-wrapper">
                          <Layout size={20} className="i-icon" />
                          <input type="text" value={onboardingData.location} onChange={e => setOnboardingData({...onboardingData, location: e.target.value})} placeholder="e.g. Bandra West, Mumbai" />
                       </div>
                    </div>

                    <div className="input-v-styled">
                       <label>Direct Business Line</label>
                       <div className="location-input-wrapper">
                          <Users size={20} className="i-icon" />
                          <input type="text" value={onboardingData.phone} onChange={e => setOnboardingData({...onboardingData, phone: e.target.value})} placeholder="+91 98765 43210" />
                       </div>
                    </div>
                    
                    <div className="setup-tip glass">
                       <Shield size={20} />
                       <p>Your data is encrypted. We only use this for your booking profile.</p>
                    </div>
                  </div>
                </motion.div>
              )}

              {onboardingStep === 3 && (
                <motion.div 
                  key="step3"
                  initial={{ x: 20, opacity: 0 }} 
                  animate={{ x: 0, opacity: 1 }} 
                  exit={{ x: -20, opacity: 0 }}
                  className="wizard-pane"
                >
                  <div className="pane-header">
                     <span className="badge">Step 03</span>
                     <h2>Brand Aesthetics</h2>
                     <p>Tailor the portal to match your unique style.</p>
                  </div>

                  <div className="pane-body">
                    <div className="styling-card glass">
                       <div className="color-preview" style={{ background: onboardingData.themeColor }}>
                          <span className="preview-text">HUB PREVIEW</span>
                       </div>
                       <div className="color-controls">
                          <label>Primary Brand Color</label>
                          <div className="color-picker-row">
                             <input type="color" value={onboardingData.themeColor} onChange={e => setOnboardingData({...onboardingData, themeColor: e.target.value})} />
                             <input type="text" value={onboardingData.themeColor} onChange={e => setOnboardingData({...onboardingData, themeColor: e.target.value})} className="hex-input" />
                          </div>
                       </div>
                    </div>

                    <div className="input-v-styled">
                       <label>Portal Visual Tone</label>
                       <div className="tone-tiles">
                          {[
                            { id: 'professional', icon: '👔', desc: 'Trust & Clarity' },
                            { id: 'vibrant', icon: '🎨', desc: 'Energy & Color' },
                            { id: 'minimalist', icon: '☁️', desc: 'Clean & Calm' }
                          ].map(t => (
                            <div 
                              key={t.id} 
                              className={`tone-tile-eco ${onboardingData.brandTone === t.id ? 'active' : ''}`}
                              onClick={() => setOnboardingData({...onboardingData, brandTone: t.id})}
                            >
                               <span className="t-emoji">{t.icon}</span>
                               <div className="t-info">
                                  <strong>{t.id.charAt(0).toUpperCase() + t.id.slice(1)}</strong>
                                  <span>{t.desc}</span>
                               </div>
                            </div>
                          ))}
                       </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="wizard-actions">
               {onboardingStep > 1 && (
                 <button className="btn-wiz-back" onClick={() => setOnboardingStep(onboardingStep - 1)}>
                    Back
                 </button>
               )}
               {onboardingStep < 3 ? (
                 <button className="btn-wiz-next" onClick={() => setOnboardingStep(onboardingStep + 1)}>
                    Continue <TrendingUp size={18} />
                 </button>
               ) : (
                 <button className="btn-wiz-launch" onClick={handleCompleteOnboarding}>
                    Launch My Ecosystem 🚀
                 </button>
               )}
            </div>
          </div>
        </div>

        <style jsx>{`
          .onboarding-master { 
             position: fixed; top: 0; left: 0; right: 0; bottom: 0; 
             background: #0f172a; display: flex; align-items: center; justify-content: center; 
             z-index: 20000; overflow: hidden; font-family: 'Inter', sans-serif;
          }

          .blob { position: absolute; width: 600px; height: 600px; border-radius: 50%; filter: blur(80px); opacity: 0.15; z-index: 0; }
          .blob-1 { background: var(--primary); top: -200px; right: -200px; animation: float 20s infinite alternate; }
          .blob-2 { background: #ec4899; bottom: -200px; left: -200px; animation: float 25s infinite alternate-reverse; }

          @keyframes float { from { transform: translate(0,0); } to { transform: translate(50px, 100px); } }

          .onboarding-container { 
             width: 1000px; height: 700px; background: rgba(255, 255, 255, 0.03); 
             backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); 
             border-radius: 40px; display: flex; z-index: 1; overflow: hidden;
             box-shadow: 0 50px 100px -20px rgba(0,0,0,0.5);
          }

          .wizard-sidebar { 
             width: 300px; background: rgba(255, 255, 255, 0.05); 
             padding: 50px; border-right: 1px solid rgba(255, 255, 255, 0.1);
             display: flex; flex-direction: column; justify-content: space-between;
          }

          .sidebar-logo { display: flex; align-items: center; gap: 12px; }
          .s-icon { font-size: 2rem; }
          .s-text { font-size: 1.5rem; font-weight: 800; color: white; letter-spacing: -0.02em; }

          .step-indicators { display: flex; flex-direction: column; gap: 30px; }
          .step-dot { display: flex; align-items: center; gap: 15px; color: rgba(255,255,255,0.4); font-weight: 600; }
          .dot-inner { 
             width: 36px; height: 36px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.1);
             display: flex; align-items: center; justify-content: center; font-size: 0.9rem;
          }
          .team-card { padding: 24px; border-radius: 24px; display: flex; flex-direction: column; gap: 20px; transition: all 0.3s; }
          .team-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); border-color: var(--primary); }
          .member-header { display: flex; align-items: center; gap: 16px; }
          .member-avatar { width: 56px; height: 56px; background: var(--primary); color: white; border-radius: 16px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; font-weight: 700; position: relative; }
          .status-dot { position: absolute; bottom: -4px; right: -4px; width: 14px; height: 14px; border-radius: 50%; border: 3px solid white; }
          .status-dot.active { background: #22c55e; box-shadow: 0 0 8px #22c55e; }
          .status-dot.offline { background: #94a3b8; }
          .member-meta h3 { margin: 0; font-size: 1.1rem; }
          .member-meta p { margin: 0; font-size: 0.8rem; color: var(--text-muted); font-weight: 600; text-transform: uppercase; letter-spacing: 0.02em; }
          .member-badges { margin-left: auto; }
          .rating-badge { background: #fef3c7; color: #b45309; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 800; display: flex; align-items: center; gap: 4px; }
          
          .member-stats-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; background: rgba(0,0,0,0.02); padding: 12px; border-radius: 12px; }
          .m-stat { text-align: center; }
          .m-val { font-weight: 800; font-size: 1.1rem; color: var(--text-main); margin-bottom: 2px; }
          .m-lbl { font-size: 0.65rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; }

          .performance-track { margin-top: 4px; }
          .track-lbl { display: flex; justify-content: space-between; font-size: 0.75rem; font-weight: 700; margin-bottom: 8px; color: var(--text-muted); }
          .track-bar { height: 6px; background: rgba(0,0,0,0.05); border-radius: 100px; overflow: hidden; }
          .track-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); transition: width 1s cubic-bezier(0.4, 0, 0.2, 1); }

          .spec-pill { background: white; border: 1px solid var(--glass-border); padding: 2px 10px; border-radius: 100px; font-size: 0.7rem; font-weight: 600; color: var(--text-muted); }
          .card-actions { display: flex; gap: 8px; margin-top: auto; border-top: 1px solid var(--glass-border); padding-top: 16px; }
          .btn-icon-only { padding: 8px; height: 36px; border: none; background: none; cursor: pointer; transition: all 0.2s; }
          .btn-icon-only:hover { background: rgba(239, 68, 68, 0.1); border-radius: 8px; }
          .step-dot.active { color: white; }
          .step-dot.active .dot-inner { border-color: var(--primary); background: var(--primary); color: white; box-shadow: 0 0 20px var(--brand-glow); }
          .step-dot.completed { color: #10b981; }
          .step-dot.completed .dot-inner { background: #10b981; border-color: #10b981; color: white; }

          .wizard-main { flex: 1; padding: 60px; display: flex; flex-direction: column; background: rgba(15, 23, 42, 0.4); position: relative; }
          .wizard-pane { flex: 1; display: flex; flex-direction: column; }
          
          .pane-header { margin-bottom: 40px; }
          .pane-header h2 { font-size: 2.5rem; color: white; margin-bottom: 10px; letter-spacing: -0.03em; }
          .pane-header p { color: rgba(255,255,255,0.5); font-size: 1.1rem; }
          .badge { 
             padding: 4px 12px; background: rgba(99, 102, 241, 0.2); 
             color: var(--primary); border-radius: 100px; font-weight: 800; 
             font-size: 0.75rem; text-transform: uppercase; margin-bottom: 20px; display: inline-block;
          }

          .pane-body { flex: 1; display: flex; flex-direction: column; gap: 30px; overflow-y: auto; padding-right: 10px; }
          .input-v-styled { display: flex; flex-direction: column; gap: 10px; }
          .input-v-styled label { color: rgba(255,255,255,0.7); font-weight: 700; font-size: 0.9rem; text-transform: uppercase; }
          .input-v-styled input, .input-v-styled textarea, .input-v-styled select { 
             background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.1); 
             border-radius: 16px; padding: 15px; color: white; font-family: inherit; font-size: 1rem;
             transition: all 0.2s;
          }
          .input-v-styled input:focus, .input-v-styled textarea:focus { border-color: var(--primary); outline: none; background: rgba(255,255,255,0.1); }

          .industry-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
          .industry-tile { 
             padding: 15px; background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1);
             border-radius: 16px; display: flex; align-items: center; gap: 12px; cursor: pointer; transition: all 0.2s;
          }
          .industry-tile:hover { background: rgba(255,255,255,0.08); transform: translateY(-3px); }
          .industry-tile.selected { background: var(--primary); border-color: var(--primary); }
          .tile-icon { width: 32px; height: 32px; background: rgba(255,255,255,0.1); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; }

          .location-input-wrapper { position: relative; }
          .i-icon { position: absolute; left: 15px; top: 50%; transform: translateY(-50%); color: rgba(255,255,255,0.3); }
          .location-input-wrapper input { padding-left: 50px; width: 100%; box-sizing: border-box; }

          .setup-tip { padding: 20px; border-radius: 20px; display: flex; align-items: center; gap: 15px; color: rgba(255,255,255,0.6); font-size: 0.9rem; margin-top: 10px; }

          .styling-card { 
             padding: 10px; border-radius: 24px; display: flex; align-items: center; gap: 20px; 
             background: rgba(255,255,255,0.03); margin-bottom: 10px;
          }
          .color-preview { width: 150px; height: 100px; border-radius: 18px; display: flex; align-items: center; justify-content: center; position: relative; overflow: hidden; }
          .preview-text { color: white; font-weight: 900; font-size: 0.8rem; opacity: 0.3; letter-spacing: 0.2em; }
          .color-controls { flex: 1; display: flex; flex-direction: column; gap: 10px; }
          .color-picker-row { display: flex; gap: 10px; }
          .color-picker-row input[type="color"] { width: 60px; height: 45px; border-radius: 12px; border: none; background: none; cursor: pointer; }
          .hex-input { flex: 1; }

          .tone-tiles { display: flex; flex-direction: column; gap: 12px; }
          .tone-tile-eco { 
             display: flex; align-items: center; gap: 20px; padding: 18px; 
             background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.1); 
             border-radius: 20px; cursor: pointer; transition: all 0.2s;
          }
          .tone-tile-eco:hover { background: rgba(255,255,255,0.08); }
          .tone-tile-eco.active { border-color: var(--primary); background: rgba(99, 102, 241, 0.1); }
          .t-emoji { font-size: 1.5rem; }
          .t-info { display: flex; flex-direction: column; }
          .t-info strong { color: white; font-size: 1rem; }
          .t-info span { color: rgba(255,255,255,0.5); font-size: 0.8rem; }

          .wizard-actions { margin-top: auto; display: flex; gap: 20px; padding-top: 30px; border-top: 1px solid rgba(255,255,255,0.1); }
          .btn-wiz-next, .btn-wiz-launch { 
             flex: 1; padding: 18px; border-radius: 18px; border: none; background: var(--primary); 
             color: white; font-weight: 800; font-size: 1rem; cursor: pointer; 
             display: flex; align-items: center; justify-content: center; gap: 10px;
             transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .btn-wiz-next:hover, .btn-wiz-launch:hover { transform: translateY(-4px); box-shadow: 0 15px 30px var(--brand-glow); }
          .btn-wiz-back { 
             padding: 0 30px; border-radius: 18px; border: 1px solid rgba(255,255,255,0.1); 
             background: none; color: white; font-weight: 700; cursor: pointer;
             transition: all 0.2s;
          }
          .btn-wiz-back:hover { background: rgba(255,255,255,0.05); }

          .sidebar-footer { color: rgba(255,255,255,0.3); font-size: 0.8rem; line-height: 1.5; }
        `}</style>
      </div>
    );
  }

  return (
    <div className="dashboard-container">

      {/* ── Portal Identity Banner ─────────────────────────────────────────────
          This tells you INSTANTLY which type of dashboard you're in.
          Companies see blue + building icon + staff count.
          Individual experts see purple + user icon.
      ──────────────────────────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 32px',
        background: user?.role === 'company_owner'
          ? 'linear-gradient(90deg, #0ea5e9 0%, #0284c7 100%)'
          : 'linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)',
        color: 'white', fontSize: '0.78rem', fontWeight: 800,
        letterSpacing: '0.03em'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {user?.role === 'company_owner' ? (
            <>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '100px' }}>
                🏢 COMPANY PORTAL
              </span>
              <span style={{ opacity: 0.85 }}>
                {expertProfile?.companyName || user?.name || 'Your Company'} &nbsp;·&nbsp; Managing {team.length} expert{team.length !== 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <>
              <span style={{ background: 'rgba(255,255,255,0.2)', padding: '3px 10px', borderRadius: '100px' }}>
                👤 EXPERT PORTAL
              </span>
              <span style={{ opacity: 0.85 }}>
                {user?.name} &nbsp;·&nbsp; Individual Service Provider
              </span>
            </>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', opacity: 0.9 }}>
          <span>🟢 Live &nbsp;·&nbsp; Real-Time Data</span>
          <span>{new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
        </div>
      </div>

      <header className="dashboard-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div className="brand-logo">{expertProfile?.logo ? <img src={expertProfile.logo} /> : <Shield size={20} />}</div>
            <span className="org-label">
              {time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <h1>
            {activeTab === 'team' ? 'Team & Experts'
              : activeTab === 'schedule' ? 'Schedule'
              : activeTab === 'services' ? 'Services'
              : activeTab === 'settings' ? (user?.role === 'company_owner' ? 'Company Settings' : 'My Profile')
              : `${getGreeting()}, ${user?.name ? user.name.split(' ')[0].charAt(0).toUpperCase() + user.name.split(' ')[0].slice(1) : 'Expert'}`}
            {' '}<span style={{ fontSize: '0.8rem', opacity: 0.5 }}>v1.1.0</span>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <p style={{ margin: 0 }}>
              {user?.role === 'company_owner'
                ? `${expertProfile?.companyName || 'Your Company'} • ${activeTab === 'team' ? 'Manage your experts & employers' : 'Company overview — all data live'}`
                : `${expertProfile?.companyName || 'Individual Expert'} • ${activeTab === 'overview' ? 'Your live session overview' : 'Manage your practice'}`}
            </p>
            {completeness < 100 && (
              <div className="completeness-bar-mini" title={`Profile ${completeness}% Complete`}>
                <div className="bar-fill" style={{ width: `${completeness}%` }}></div>
              </div>
            )}
          </div>
          <button onClick={() => window.location.reload(true)} className="btn btn-link" style={{ fontSize: '0.7rem', padding: 0 }}>↻ Refresh Live Data</button>
        </div>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <div className="notification-bell-wrapper">
             <button className={`notif-btn ${notifications.some(n => !n.isRead) ? 'has-unread' : ''}`} onClick={() => setShowNotifications(!showNotifications)}>
                <Zap size={22} />
             </button>
             <AnimatePresence>
               {showNotifications && (
                 <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} className="notif-dropdown glass">
                    <div className="notif-head">
                       <span>Live Alerts</span>
                       <button onClick={markAllRead}>Clear All</button>
                    </div>
                    <div className="notif-body">
                       {notifications.length > 0 ? notifications.slice(0, 5).map(n => (
                         <div key={n._id} className={`notif-item ${!n.isRead ? 'unread' : ''}`}>
                            <div className="n-dot"></div>
                            <div className="n-text">
                               <p>{n.message}</p>
                               <span>{new Date(n.createdAt).toLocaleTimeString()}</span>
                            </div>
                         </div>
                       )) : <div className="notif-empty">No new alerts</div>}
                    </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
          <Link to="/hub/analytics" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <BarChart2 size={16} /> Analytics
          </Link>
          <Link to="/hub/invoices" className="btn btn-outline btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={16} /> Invoices
          </Link>
          <button onClick={() => setActiveTab('schedule')} className="btn btn-primary btn-sm">+ Manage Capacity</button>
        </div>
      </header>

      <nav className="hub-tabs">
        <button className={`tab-link ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
          <TrendingUp size={18} /> {user?.role === 'company_owner' ? 'Company Overview' : 'My Dashboard'}
        </button>
        {user?.role === 'company_owner' && (
          <button className={`tab-link ${activeTab === 'team' ? 'active' : ''}`} onClick={() => setActiveTab('team')}>
            <Users size={18} /> Experts & Staff
          </button>
        )}
        <button className={`tab-link ${activeTab === 'schedule' ? 'active' : ''}`} onClick={() => setActiveTab('schedule')}>
          <Calendar size={18} /> {user?.role === 'company_owner' ? 'Booking Calendar' : 'My Slots'}
        </button>
        <button className={`tab-link ${activeTab === 'services' ? 'active' : ''}`} onClick={() => setActiveTab('services')}>
          <Layout size={18} /> Service Menu
        </button>
        <button className={`tab-link ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={18} /> {user?.role === 'company_owner' ? 'Company Settings' : 'My Profile'}
        </button>
      </nav>


      {activeTab === 'overview' ? (
        <>
          <section className="stats-grid">
            {user?.role === 'company_owner' && (
               <div className="stat-card glass">
                 <div className="stat-icon purple"><DollarSign size={24} /></div>
                 <div className="stat-info">
                   <h3>₹{stats.revenue.toLocaleString()}</h3>
                   <p>Total Revenue</p>
                 </div>
               </div>
            )}
            <div className="stat-card glass">
              <div className="stat-icon blue"><Calendar size={24} /></div>
              <div className="stat-info">
                <h3>{stats.total}</h3>
                <p>{user?.role === 'company_owner' ? 'All Bookings' : 'My Bookings'}</p>
              </div>
            </div>
            <div className="stat-card glass">
              <div className="stat-icon pink"><Clock size={24} /></div>
              <div className="stat-info">
                <h3>{stats.pending}</h3>
                <p>Pending Review</p>
              </div>
            </div>
            <div className="stat-card glass">
              <div className="stat-icon green"><CheckCircle size={24} /></div>
              <div className="stat-info">
                <h3>{stats.completed || 0}</h3>
                <p>Completed Sessions</p>
              </div>
            </div>
            <div className="stat-card glass">
              <div className="stat-icon purple"><Activity size={24} /></div>
              <div className="stat-info">
                <h3>{Math.round((stats.completed / (slots.length || 1)) * 100)}%</h3>
                <p>Capacity Used</p>
              </div>
            </div>
          </section>

          <div className="dashboard-analytics-hub">
             <div className="chart-container-hub glass">
                <div className="chart-header-hub">
                   <div>
                      <h4><TrendingUp size={18} /> Performance Overview</h4>
                      <p>Visualizing your professional growth and revenue trend</p>
                   </div>
                   <div className="chart-badge">Live Analytics</div>
                </div>
                <div style={{ width: '100%', height: 260 }}>
                   <ResponsiveContainer>
                      <AreaChart data={getChartData()}>
                        <defs>
                          <linearGradient id="colorHub" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="var(--primary)" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="name" hide />
                        <Tooltip 
                           contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: 'var(--shadow)' }}
                           itemStyle={{ fontWeight: 800, color: 'var(--primary)' }}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="var(--primary)" fillOpacity={1} fill="url(#colorHub)" strokeWidth={3} />
                      </AreaChart>
                   </ResponsiveContainer>
                </div>
             </div>
          </div>

          <main className="dashboard-content">
            <div className="recent-bookings glass">
              <div className="section-title">
                <h2>Recent Appointments</h2>
                <Link to="/hub/analytics" className="text-link">View Detailed Analytics →</Link>
              </div>

              <div className="bookings-table">
                <div className="table-header">
                  <span>Client</span>
                  <span>Time</span>
                  <span>Status</span>
                  <span>Action</span>
                </div>
                {loading ? (
                   <div className="loading">Updating session data...</div>
                ) : bookings.length > 0 ? bookings.map((booking) => (
                  <div key={booking._id} className="table-row">
                    <div className="user-info">
                      <div className="avatar-sm">{booking.customerId?.name ? booking.customerId.name[0] : 'U'}</div>
                      <div>
                        <span className="name-main">{booking.customerName || booking.customerId?.name}</span>
                        <span className="service-sub">{booking.serviceTitle}</span>
                      </div>
                    </div>
                    <div className="time-info">
                      <Clock size={16} />
                      <span>{new Date(booking.date).toLocaleDateString()} at {booking.startTime}</span>
                    </div>
                    <div className={`status-pill ${booking.status.toLowerCase()}`}>
                      {booking.status}
                    </div>
                    <div className="actions">
                      {booking.status === 'Pending' && (
                        <button onClick={() => updateStatus(booking._id, 'Confirmed')} className="btn-icon check" title="Confirm">
                          <Check size={16} />
                        </button>
                      )}
                      {booking.status === 'Confirmed' && (
                        <button onClick={() => updateStatus(booking._id, 'Completed')} className="btn-icon success" title="Complete">
                          <CheckCircle size={16} />
                        </button>
                      )}
                      {['Pending', 'Confirmed'].includes(booking.status) && (
                        <button onClick={() => updateStatus(booking._id, 'Cancelled')} className="btn-icon x" title="Cancel">
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="empty-table">No appointments yet.</div>
                )}
              </div>
            </div>
          </main>

          {expertProfile?.timeSlots?.length === 0 && (
            <div className="empty-prompt glass">
               <Calendar size={48} color="var(--primary)" />
               <h3>No Available Slots Created</h3>
               <p>Patients and clients cannot book sessions until you define your availability.</p>
               <Link to="/hub/schedule" className="btn btn-primary">Setup Your Calendar Now</Link>
            </div>
          )}
        </>
      ) : activeTab === 'team' && user?.role === 'company_owner' ? (
        <section className="team-management">
          {/* Team content */}
          <div className="team-header-row">
            <div>
              <h2>Organization Specialists</h2>
              <p>You have {team.length} active staff members in your facility.</p>
            </div>
            <button onClick={() => { setIsEditingStaff(null); setNewStaff({name:'', role:'', specialization:''}); setShowStaffModal(true); }} className="btn btn-primary">
              <Plus size={18} /> Add Member
            </button>
          </div>
          <div className="team-grid-hub">
            {team.map(member => (
               <div key={member._id} className="team-card glass">
                 <div className="member-header">
                    <div className="member-avatar">
                      {member.name[0]}
                      <span className={`status-dot ${member.isActive ? 'active' : 'offline'}`} title={member.isActive ? 'Online & Available' : 'Currently Offline'}></span>
                    </div>
                    <div className="member-meta">
                      <h3>{member.name}</h3>
                      <p>{member.role}</p>
                    </div>
                    <div className="member-badges">
                      <span className="rating-badge"><Star size={12} fill="currentColor" /> {member.rating || '5.0'}</span>
                    </div>
                 </div>
                 
                 <div className="member-stats-row">
                    <div className="m-stat">
                       <p className="m-val">{getMemberStats(member._id).completed}</p>
                       <p className="m-lbl">Sessions</p>
                    </div>
                    <div className="m-stat">
                       <p className="m-val">{getMemberStats(member._id).successRate}%</p>
                       <p className="m-lbl">Success Rate</p>
                    </div>
                    <div className="m-stat">
                       <p className="m-val">₹{getMemberStats(member._id).revenue.toLocaleString()}</p>
                       <p className="m-lbl">Yield</p>
                    </div>
                 </div>

                 <div className="performance-track">
                    <div className="track-lbl">
                       <span>Monthly Target</span>
                       <span>{Math.min(100, Math.round((getMemberStats(member._id).completed / 20) * 100))}%</span>
                    </div>
                    <div className="track-bar">
                       <div className="track-fill" style={{ width: `${Math.min(100, Math.round((getMemberStats(member._id).completed / 20) * 100))}%` }}></div>
                    </div>
                 </div>

                 <div className="member-tags">
                   {member.specialization.map((spec, idx) => (
                     <span key={idx} className="spec-pill">{spec}</span>
                   ))}
                 </div>
                 
                 <div className="card-actions">
                   <button type="button" className="btn btn-outline btn-sm" onClick={() => { setSelectedStaff(member); setShowActivityModal(true); }}>Track Activity</button>
                   <button type="button" className="btn btn-outline btn-sm" onClick={() => openEditStaff(member)}><Settings size={14} /></button>
                   <button type="button" className="btn btn-icon-only text-danger" onClick={() => handleRemoveStaff(member._id)}><Trash2 size={16} /></button>
                 </div>
               </div>
            ))}
            {team.length === 0 && <div className="empty-team glass">No staff members found.</div>}
          </div>
        </section>
      ) : activeTab === 'schedule' ? (
        <section className="schedule-hub">
           <div className="section-title">
             <h2>Manage Availability</h2>
             <p>Add time slots for clients to book sessions with your organization.</p>
           </div>
           <div className="add-slot-bar glass">
              <div className="input-v">
                 <label>Date</label>
                 <input type="date" value={newSlot.date} onChange={e => setNewSlot({...newSlot, date: e.target.value})} />
              </div>
              <div className="input-v">
                 <label>Start Time</label>
                 <div className="time-pick">
                    <select value={newSlot.startHour} onChange={e => setNewSlot({...newSlot, startHour: e.target.value})}>
                       {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select value={newSlot.startPeriod} onChange={e => setNewSlot({...newSlot, startPeriod: e.target.value})}>
                       <option value="AM">AM</option><option value="PM">PM</option>
                    </select>
                 </div>
              </div>
              <div className="input-v">
                 <label>End Time</label>
                 <div className="time-pick">
                    <select value={newSlot.endHour} onChange={e => setNewSlot({...newSlot, endHour: e.target.value})}>
                       {['01','02','03','04','05','06','07','08','09','10','11','12'].map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <select value={newSlot.endPeriod} onChange={e => setNewSlot({...newSlot, endPeriod: e.target.value})}>
                       <option value="AM">AM</option><option value="PM">PM</option>
                    </select>
                 </div>
              </div>
              <button onClick={handleAddSlot} className="btn btn-primary" style={{ height: 'fit-content', marginTop: 'auto' }}>Add Slot</button>
           </div>
           
           <div className="slots-grid-hub">
              {slots.map(slot => (
                <div key={slot._id} className={`slot-card-hub glass ${slot.isBooked ? 'booked' : ''}`}>
                   <div className="slot-d">{new Date(slot.date).toLocaleDateString()}</div>
                   <div className="slot-t">{formatTimeAMPM(slot.startTime)} - {formatTimeAMPM(slot.endTime)}</div>
                   {!slot.isBooked && <button onClick={() => handleDeleteSlot(slot._id)} className="slot-del"><Trash2 size={16} /></button>}
                </div>
              ))}
           </div>
        </section>
      ) : activeTab === 'services' ? (
        <section className="services-hub">
           <div className="section-title">
             <h2>Managed Services</h2>
             <p>Define the types of sessions and professional services your brand offers.</p>
           </div>
           <div className="services-list-eco">
              {expertProfile?.services?.map((svc, i) => (
                <div key={i} className="svc-card-eco glass">
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                     <h4 style={{ margin: 0, flex: 1 }}>{svc.title}</h4>
                     <div style={{ display: 'flex', gap: '8px' }}>
                       <button onClick={() => openEditService(svc, i)} style={{ color: 'var(--primary)', background: 'rgba(99,102,241,0.1)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
                         <Layout size={16} />
                       </button>
                       <button onClick={() => handleDeleteService(i)} style={{ color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px' }}>
                         <Trash2 size={16} />
                       </button>
                     </div>
                   </div>
                   <p>{svc.description}</p>
                   <div className="svc-footer"><span>{svc.duration} Min</span> <span>₹{svc.price}</span></div>
                </div>
              ))}
              <div className="svc-add-box glass dashed" onClick={() => { setIsEditingService(null); setNewService({title:'', description:'', price:'', duration:'60'}); setShowServiceModal(true); }}>
                 <Plus size={32} />
                 <p>Add New Service</p>
              </div>
           </div>
        </section>
      ) : activeTab === 'settings' ? (
        <section className="settings-hub">
           <div className="section-title">
             <h2>{user?.role === 'company_owner' ? 'Hub Settings' : 'Personal Profile Settings'}</h2>
             <p>{user?.role === 'company_owner' ? 'Configure your organization\'s brand identity and professional profile.' : 'Manage your expert profile and professional details.'}</p>
           </div>
           <div className="settings-grid-eco">
              <div className="settings-panel glass">
                 <h3>{user?.role === 'company_owner' ? 'Brand Identity' : 'My Public Identity'}</h3>
                 <div className="input-v-group">
                    <div className="input-v">
                       <label>{user?.role === 'company_owner' ? 'Organization Name' : 'Full Name'}</label>
                       <input type="text" value={expertProfile?.companyName || expertProfile?.name || ''} onChange={e => setExpertProfile({...expertProfile, companyName: e.target.value})} />
                    </div>
                    <div className="input-v">
                       <label>Years of Expertise</label>
                       <input type="number" value={expertProfile?.experience || 0} onChange={e => setExpertProfile({...expertProfile, experience: parseInt(e.target.value) || 0})} />
                    </div>
                    {user?.role === 'company_owner' && (
                        <div className="input-v">
                           <label>Category / Specialization</label>
                           <select 
                             className="eco-textarea" 
                             value={expertProfile?.category || ''} 
                             onChange={e => setExpertProfile({...expertProfile, category: e.target.value})}
                             style={{ padding: '12px' }}
                           >
                             <option value="" disabled>Select your primary industry</option>
                             {categories.map(cat => (
                               <option key={cat._id} value={cat.name}>{cat.name}</option>
                             ))}
                           </select>
                        </div>
                    )}
                 </div>
                 <div className="input-v-group" style={{ marginTop: '20px' }}>
                    <div className="input-v">
                       <label>{user?.role === 'company_owner' ? 'Headquarters Location' : 'Consultation Location'}</label>
                       <input type="text" value={expertProfile?.location || ''} onChange={e => setExpertProfile({...expertProfile, location: e.target.value})} placeholder="e.g. 1st Ave, Mumbai or Virtual" />
                    </div>
                    <div className="input-v">
                       <label>Support Contact (Phone)</label>
                       <input type="text" value={expertProfile?.phone || ''} onChange={e => setExpertProfile({...expertProfile, phone: e.target.value})} placeholder="e.g. +91 9876543210" />
                    </div>
                 </div>
                 {user?.role === 'company_owner' && (
                    <div className="input-v-group" style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid var(--glass-border)' }}>
                       <div className="input-v">
                          <label>Brand Primary Color</label>
                          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                             <input type="color" value={expertProfile?.themeColor || '#6366f1'} onChange={e => setExpertProfile({...expertProfile, themeColor: e.target.value})} style={{ width: '50px', height: '40px', padding: '2px', border: '2px solid #1a1a1a', cursor: 'pointer' }} />
                             <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{expertProfile?.themeColor || '#6366f1'}</span>
                          </div>
                       </div>
                       <div className="input-v">
                          <label>Platform Brand Tone</label>
                          <select 
                            className="eco-textarea"
                            value={expertProfile?.brandTone || 'professional'} 
                            onChange={e => setExpertProfile({...expertProfile, brandTone: e.target.value})}
                            style={{ padding: '12px' }}
                          >
                            <option value="professional">Professional (Clean & Balanced)</option>
                            <option value="vibrant">Vibrant (High Energy & Contrast)</option>
                            <option value="minimalist">Minimalist (Subtle & Airy)</option>
                          </select>
                       </div>
                    </div>
                 )}
              </div>
              <div className="settings-panel glass">
                 <h3>{user?.role === 'company_owner' ? 'Professional Bio' : 'My Expert Bio'}</h3>
                 <textarea 
                   className="eco-textarea" 
                   rows="6" 
                   value={expertProfile?.bio || ''} 
                   onChange={e => setExpertProfile({...expertProfile, bio: e.target.value})}
                   placeholder="Describe your profile and expertise..."
                 ></textarea>
                 <button onClick={handleUpdateProfile} className="btn btn-primary" style={{ marginTop: '20px' }}>Save Changes</button>
              </div>
              <button 
                type="button" 
                className="btn btn-primary" 
                style={{ marginTop: '32px', width: '200px' }} 
                onClick={handleUpdateProfile}
              >
                Save Organization Settings
              </button>
           </div>
        </section>
      ) : null}

      <AnimatePresence>
        {showActivityModal && selectedStaff && (
          <div className="modal-overlay-eco" onClick={() => setShowActivityModal(false)}>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="modal-content-eco activity-audit glass"
              onClick={e => e.stopPropagation()}
            >
              <div className="audit-header">
                 <div>
                    <h2><Activity size={24} color="var(--primary)" /> Activity Audit: {selectedStaff.name}</h2>
                    <p>Complete forensic session history and performance logs</p>
                 </div>
                 <button className="close-eco" onClick={() => setShowActivityModal(false)}><X /></button>
              </div>

              <div className="audit-body">
                 <div className="audit-stats">
                    <div className="a-stat"><span>Assigned</span> <h4>{getMemberStats(selectedStaff._id).total}</h4></div>
                    <div className="a-stat"><span>Completed</span> <h4>{getMemberStats(selectedStaff._id).completed}</h4></div>
                    <div className="a-stat"><span>Reliability</span> <h4>{getMemberStats(selectedStaff._id).successRate}%</h4></div>
                 </div>

                 <div className="audit-timeline">
                    <h4>Session Log (Real Data)</h4>
                    {bookings.filter(b => b.assignedStaffId?._id === selectedStaff._id || b.assignedStaffId === selectedStaff._id).map((b, i) => (
                       <div key={b._id} className="timeline-item">
                          <div className="t-dot"></div>
                          <div className="t-content">
                             <div className="t-head">
                                <strong>{b.customerName}</strong>
                                <span className={`t-pill ${b.status.toLowerCase()}`}>{b.status}</span>
                             </div>
                             <p>{b.serviceTitle} • {new Date(b.date).toLocaleDateString()} at {b.startTime}</p>
                          </div>
                       </div>
                    ))}
                    {bookings.filter(b => b.assignedStaffId?._id === selectedStaff._id || b.assignedStaffId === selectedStaff._id).length === 0 && (
                       <div className="empty-audit">No session records found for this specialist.</div>
                    )}
                 </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {showStaffModal && (
        <div className="modal-overlay">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-content glass">
            <h2>{isEditingStaff ? 'Edit Member' : 'Add New Member'}</h2>
            <form onSubmit={handleAddStaff} className="staff-form">
              <div className="input-group-v">
                <label>Full Name</label>
                <input required value={newStaff.name} onChange={e => setNewStaff({...newStaff, name: e.target.value})} placeholder="e.g. Dr. John Doe" />
              </div>
              <div className="input-group-v">
                <label>Role</label>
                <input required value={newStaff.role} onChange={e => setNewStaff({...newStaff, role: e.target.value})} placeholder="e.g. Senior Surgeon" />
              </div>
              <div className="input-group-v">
                <label>Specializations (comma separated)</label>
                <input value={newStaff.specialization} onChange={e => setNewStaff({...newStaff, specialization: e.target.value})} placeholder="e.g. Cardiology, Radiology" />
              </div>
              <div className="input-group-v">
                <label>Years of Experience</label>
                <input type="number" required value={newStaff.experience} onChange={e => setNewStaff({...newStaff, experience: e.target.value})} placeholder="e.g. 5" />
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowStaffModal(false); setIsEditingStaff(null); }} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">{isEditingStaff ? 'Save Changes' : 'Save Member'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {showServiceModal && (
        <div className="modal-overlay">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-content glass">
            <h2>{isEditingService !== null ? 'Edit Service Offering' : 'Create New Service Offering'}</h2>
            <form onSubmit={handleAddService} className="staff-form">
              <div className="input-group-v">
                <label>Service Title</label>
                <input required value={newService.title} onChange={e => setNewService({...newService, title: e.target.value})} placeholder="e.g. Senior Architecture Audit" />
              </div>
              <div className="input-group-v">
                <label>Description</label>
                <textarea required rows="3" className="eco-textarea" value={newService.description} onChange={e => setNewService({...newService, description: e.target.value})} placeholder="What value does this session provide?"></textarea>
              </div>
              <div className="input-group-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
                <div className="input-group-v">
                  <label>Price (₹)</label>
                  <input type="number" required value={newService.price} onChange={e => setNewService({...newService, price: e.target.value})} placeholder="e.g. 5000" />
                </div>
                <div className="input-group-v">
                  <label>Duration (Minutes)</label>
                  <input type="number" required value={newService.duration} onChange={e => setNewService({...newService, duration: e.target.value})} placeholder="e.g. 60" />
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowServiceModal(false); setIsEditingService(null); }} className="btn btn-outline">Cancel</button>
                <button type="submit" className="btn btn-primary">{isEditingService !== null ? 'Save Changes' : 'Publish Service'}</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <style jsx>{`
        .dashboard-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 100px 20px 40px;
        }

        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }

        .org-label {
          background: var(--primary);
          color: white;
          padding: 2px 10px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
        }

        .brand-logo {
          width: 32px;
          height: 32px;
          background: rgba(99, 102, 241, 0.1);
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--primary);
        }

        .hub-tabs {
          display: flex;
          gap: 24px;
          margin-bottom: 32px;
          border-bottom: 1px solid var(--glass-border);
          padding-bottom: 2px;
        }
        
        .tab-link {
          display: flex;
          align-items: center;
          gap: 8px;
          background: none;
          border: none;
          padding: 12px 0;
          color: var(--text-muted);
          font-weight: 700;
          cursor: pointer;
          position: relative;
          transition: color 0.2s;
        }
        
        .tab-link.active {
          color: var(--primary);
        }
        
        .tab-link.active::after {
          content: '';
          position: absolute;
          bottom: -2px;
          left: 0;
          right: 0;
          height: 3px;
          background: var(--primary);
          border-radius: 10px;
        }

        .tab-link.disabled { opacity: 0.3; cursor: not-allowed; }

        .section-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        
        .text-link {
          color: var(--primary);
          font-weight: 700;
          font-size: 0.9rem;
          text-decoration: none;
        }

        .team-management { animation: fadeIn 0.4s ease-out; }
        .team-header-row { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 32px; }
        .team-grid-hub { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
        .team-card-hub { padding: 24px; border-radius: 20px; display: flex; align-items: center; gap: 20px; position: relative; }
        .member-avatar { width: 48px; height: 48px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; }
        .member-role { 
          font-size: 0.85rem; 
          font-weight: 700;
          color: var(--primary);
          background: rgba(99, 102, 241, 0.08);
          padding: 3px 10px;
          border-radius: 8px;
          display: inline-block;
          margin-bottom: 8px;
        }
        .specialties { display: flex; gap: 6px; flex-wrap: wrap; }
        .s-tag { font-size: 0.7rem; background: rgba(0,0,0,0.04); padding: 2px 8px; border-radius: 4px; font-weight: 700; }
        .staff-actions { display: flex; gap: 8px; position: absolute; top: 12px; right: 12px; }
        .edit-staff-btn { border: none; background: rgba(99,102,241,0.1); color: var(--primary); opacity: 1; cursor: pointer; transition: background 0.2s; padding: 6px; border-radius: 8px; }
        .edit-staff-btn:hover { background: var(--primary); color: white; }
        .delete-staff-btn { border: none; background: rgba(239,68,68,0.1); color: #ef4444; opacity: 1; cursor: pointer; transition: background 0.2s; padding: 6px; border-radius: 8px; }
        .delete-staff-btn:hover { background: #ef4444; color: white; }
        .empty-team { padding: 60px; text-align: center; border-radius: 24px; color: var(--text-muted); }

        .modal-overlay { position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.4); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; z-index: 2005; }
        .modal-content { padding: 32px; width: 400px; border-radius: 24px; }
        .staff-form { display: flex; flex-direction: column; gap: 20px; margin-top: 24px; }
        .input-group-v { display: flex; flex-direction: column; gap: 6px; }
        .input-group-v label { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }
        .input-group-v input { padding: 12px; border: 2px solid #1a1a1a; border-radius: 12px; background: white; font-family: inherit; color: #1a1a1a; transition: all 0.2s; }
        .input-group-v input:focus { box-shadow: 0 0 0 4px rgba(26, 26, 26, 0.1); outline: none; }
        .modal-actions { display: flex; gap: 12px; margin-top: 10px; }
        .modal-actions .btn { flex: 1; }

        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

        .dashboard-header h1 {
          font-size: 2.5rem;
          margin-bottom: 8px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 20px;
          padding: 24px;
          border-radius: 20px;
        }

        .stat-icon {
          width: 56px;
          height: 56px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .purple { background: rgba(139, 92, 246, 0.1); color: #8b5cf6; }
        .blue { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
        .pink { background: rgba(236, 72, 153, 0.1); color: #ec4899; }
        .green { background: rgba(34, 197, 94, 0.1); color: #22c55e; }

        .stat-info h3 {
          font-size: 1.75rem;
          line-height: 1;
          margin-bottom: 4px;
        }

        .stat-info p {
          color: var(--text-muted);
          font-size: 0.9rem;
          font-weight: 500;
        }

        .recent-bookings {
          padding: 32px;
          border-radius: 24px;
        }

        .section-title {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }

        .bookings-table {
          display: flex;
          flex-direction: column;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr;
          padding: 0 16px 16px;
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.9rem;
          border-bottom: 1px solid var(--glass-border);
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 2fr 1fr 1fr;
          padding: 16px;
          align-items: center;
          border-bottom: 1px solid var(--glass-border);
          transition: background 0.2s;
        }

        .table-row:hover {
          background: rgba(255,255,255,0.4);
        }

        .user-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-sm {
          width: 32px;
          height: 32px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          font-weight: 700;
        }

        .name-main { font-weight: 600; display: block; }
        .service-sub { font-size: 0.75rem; color: var(--text-muted); display: block; }

        .time-info {
          display: flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 0.9rem;
        }

        .status-pill {
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
          text-align: center;
          width: fit-content;
        }

        .status-pill.pending { background: #fef3c7; color: #d97706; }
        .status-pill.confirmed { background: #dcfce7; color: #16a34a; }
        .status-pill.completed { background: #e0f2fe; color: #0369a1; }
        .status-pill.cancelled { background: #fee2e2; color: #ef4444; }

        .actions {
          display: flex;
          gap: 8px;
        }

        .btn-icon {
          background: none;
          border: 1px solid var(--glass-border);
          padding: 6px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-icon.check { color: #16a34a; }
        .btn-icon.success { color: #0369a1; }
        .btn-icon.x { color: #ef4444; }
        .btn-icon:hover { background: rgba(0,0,0,0.05); }

        .empty-table, .loading {
          text-align: center;
          padding: 40px;
          color: var(--text-muted);
        }

        .empty-prompt {
          margin-top: 24px;
          padding: 60px;
          text-align: center;
          border-radius: 24px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 16px;
        }

        .empty-prompt h3 { font-size: 1.5rem; }
        .empty-prompt p { max-width: 400px; color: var(--text-muted); margin-bottom: 8px; }

        .schedule-hub { animation: fadeIn 0.4s ease-out; }
        .add-slot-bar { display: flex; gap: 20px; padding: 24px; border-radius: 20px; margin-bottom: 32px; align-items: flex-end; }
        .input-v { display: flex; flex-direction: column; gap: 6px; }
        .input-v label { font-size: 0.75rem; font-weight: 800; text-transform: uppercase; color: var(--text-muted); }
        .input-v input, .time-pick select { padding: 10px; border: 2px solid #1a1a1a; border-radius: 10px; background: white; font-family: inherit; font-weight: 600; color: #1a1a1a; transition: all 0.2s; }
        .input-v input:focus, .time-pick select:focus { box-shadow: 0 0 0 4px rgba(26, 26, 26, 0.1); outline: none; }
        .time-pick { display: flex; gap: 4px; }
        .slots-grid-hub { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 20px; }
        .slot-card-hub { padding: 20px; border-radius: 16px; position: relative; }
        .slot-d { font-weight: 800; font-size: 0.9rem; margin-bottom: 4px; }
        .slot-t { font-size: 0.85rem; color: var(--text-muted); font-weight: 600; }
        .slot-del { position: absolute; top: 12px; right: 12px; border: none; background: rgba(239,68,68,0.1); color: #ef4444; padding: 6px; border-radius: 8px; cursor: pointer; opacity: 1; transition: background 0.2s; }
        .slot-del:hover { background: #ef4444; color: white; }
        .booked-badge { font-size: 0.7rem; color: #16a34a; font-weight: 800; text-transform: uppercase; margin-top: 8px; display: block; }
        .empty-slots { grid-column: 1/-1; padding: 60px; text-align: center; border-radius: 24px; color: var(--text-muted); }

        /* ── Services Hub ── */
        .services-hub { animation: fadeIn 0.4s ease-out; }
        .services-list-eco { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 24px; margin-top: 32px; }
        .svc-card-eco { padding: 24px; border-radius: 20px; border-left: 4px solid var(--primary); }
        .svc-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .svc-header h4 { font-size: 1.1rem; font-weight: 800; }
        .svc-price { font-weight: 800; color: var(--primary); }
        .svc-card-eco p { font-size: 0.85rem; color: var(--text-muted); margin-bottom: 20px; line-height: 1.6; }
        .svc-footer { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; font-weight: 700; }
        .svc-add-box { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px; min-height: 180px; color: var(--text-muted); cursor: pointer; border: 2px dashed var(--glass-border); background: none !important; }
        .svc-add-box:hover { border-color: var(--primary); color: var(--primary); }

        /* ── Settings Hub ── */
        .settings-hub { animation: fadeIn 0.4s ease-out; }
        .settings-grid-eco { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 32px; }
        .settings-panel { padding: 32px; border-radius: 24px; }
        .settings-panel h3 { font-size: 1.25rem; margin-bottom: 24px; }
        .brand-upload-zone { display: flex; align-items: center; gap: 24px; margin-bottom: 32px; padding-bottom: 32px; border-bottom: 1px solid var(--glass-border); }
        .brand-preview-lg { width: 80px; height: 80px; border-radius: 20px; background: #f8f9fa; border: 1px solid var(--glass-border); display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .brand-preview-lg img { width: 100%; height: 100%; object-fit: cover; }
        .input-v-group { display: flex; flex-direction: column; gap: 20px; }
        .eco-textarea { width: 100%; border: 2px solid #1a1a1a; border-radius: 16px; padding: 16px; font-family: inherit; resize: none; background: #ffffff; color: #1a1a1a; font-weight: 500; transition: all 0.2s; }
        .eco-textarea:focus { box-shadow: 0 0 0 4px rgba(26, 26, 26, 0.1); outline: none; }

        .completeness-bar-mini { width: 100px; height: 6px; background: rgba(0,0,0,0.05); border-radius: 10px; overflow: hidden; }
        .bar-fill { height: 100%; background: linear-gradient(90deg, #6366f1, #22c55e); transition: width 0.5s ease; }

        .notification-bell-wrapper { position: relative; }
        .notif-btn { background: none; border: none; color: var(--text-muted); cursor: pointer; position: relative; padding: 8px; border-radius: 10px; transition: all 0.2s; }
        .notif-btn:hover { background: rgba(0,0,0,0.03); color: var(--primary); }
        .notif-btn.has-unread::after { content: ''; position: absolute; top: 8px; right: 8px; width: 8px; height: 8px; background: #ef4444; border-radius: 50%; border: 2px solid #fff; }

        .notif-dropdown { position: absolute; top: 100%; right: 0; width: 300px; margin-top: 12px; z-index: 1000; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.1); }
        .notif-head { padding: 16px; background: rgba(0,0,0,0.02); display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid var(--glass-border); }
        .notif-head span { font-weight: 800; font-size: 0.85rem; text-transform: uppercase; }
        .notif-head button { background: none; border: none; color: var(--primary); font-weight: 700; font-size: 0.75rem; cursor: pointer; }
        .notif-body { max-height: 300px; overflow-y: auto; }
        .notif-item { padding: 16px; display: flex; gap: 12px; border-bottom: 1px solid var(--glass-border); transition: background 0.15s; }
        .notif-item:hover { background: rgba(0,0,0,0.01); }
        .notif-item.unread { background: rgba(99, 102, 241, 0.03); }
        .n-dot { width: 8px; height: 8px; background: var(--primary); border-radius: 50%; margin-top: 5px; flex-shrink: 0; opacity: 0; }
        .notif-item.unread .n-dot { opacity: 1; }
        .n-text p { font-size: 0.85rem; margin-bottom: 4px; font-weight: 500; }
        .n-text span { font-size: 0.7rem; color: var(--text-muted); }
        .booking-row { display: flex; align-items: center; justify-content: space-between; padding: 16px; border-bottom: 1px solid var(--glass-border); transition: all 0.2s; }
        .booking-row:hover { background: rgba(0,0,0,0.02); }
        .table-row { display: grid; grid-template-columns: 2fr 1.5fr 1fr 1fr; padding: 20px; border-bottom: 1px solid var(--glass-border); align-items: center; }

        .dashboard-analytics-hub { margin-bottom: 40px; }
        .chart-container-hub { padding: 32px; border-radius: 32px; position: relative; }
        .chart-header-hub { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; }
        .chart-header-hub h4 { display: flex; align-items: center; gap: 8px; font-size: 1.1rem; margin-bottom: 4px; }
        .chart-header-hub p { font-size: 0.85rem; color: var(--text-muted); margin: 0; }
        .chart-badge { background: #f0fdf4; color: #16a34a; font-size: 0.7rem; font-weight: 800; padding: 4px 12px; border-radius: 100px; text-transform: uppercase; }

        .n-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); }
        .notif-item { display: flex; gap: 12px; align-items: center; padding: 12px; border-bottom: 1px solid rgba(0,0,0,0.05); }
        .notif-item.unread { background: rgba(99,102,241,0.05); }
        .n-text p { font-size: 0.82rem; margin: 0; color: var(--text-main); line-height: 1.4; }
        .n-text span { font-size: 0.7rem; color: var(--text-muted); }

        .audit-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 1px solid var(--glass-border); padding-bottom: 20px; }
        .audit-header h2 { display: flex; align-items: center; gap: 12px; margin: 0; }
        .audit-header p { margin: 4px 0 0; color: var(--text-muted); font-size: 0.9rem; }
        .audit-stats { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-bottom: 32px; }
        .a-stat { background: rgba(0,0,0,0.02); padding: 16px; border-radius: 12px; text-align: center; }
        .a-stat span { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; font-weight: 800; display: block; margin-bottom: 4px; }
        .a-stat h4 { margin: 0; font-size: 1.5rem; color: var(--primary); }
        .audit-timeline { max-height: 400px; overflow-y: auto; }
        .timeline-item { display: flex; gap: 16px; margin-bottom: 20px; position: relative; }
        .timeline-item::before { content: ''; position: absolute; left: 4px; top: 20px; bottom: -24px; width: 1px; background: var(--glass-border); }
        .timeline-item:last-child::before { display: none; }
        .t-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--primary); margin-top: 6px; z-index: 1; }
        .t-content { flex: 1; }
        .t-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
        .t-pill { font-size: 0.65rem; padding: 2px 8px; border-radius: 100px; font-weight: 800; text-transform: uppercase; }
        .t-pill.completed { background: #f0fdf4; color: #16a34a; }
        .t-pill.pending { background: #fffbeb; color: #b45309; }
        .t-pill.confirmed { background: #f0f9ff; color: #0369a1; }
        .t-pill.cancelled { background: #fef2f2; color: #ef4444; }
        .empty-audit { padding: 40px; text-align: center; color: var(--text-muted); font-size: 0.9rem; font-style: italic; }
      `}</style>
    </div>
  );
};

export default ProviderDashboard;
