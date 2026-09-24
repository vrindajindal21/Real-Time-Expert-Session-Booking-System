import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Clock, User, MessageSquare, CheckCircle, 
  TrendingUp, Activity, UserCheck, Shield, ChevronRight, LogOut, Power
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';

const StaffDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'stats', 'profile'
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    fetchStaffData();
    const timer = setInterval(() => setTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const fetchStaffData = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_CONFIG.baseUrl}/staff/me/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(data.data);
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync with enterprise hub');
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async () => {
    try {
       const token = localStorage.getItem('token');
       const { data: res } = await axios.patch(`${API_CONFIG.baseUrl}/staff/me/status`, {}, {
         headers: { Authorization: `Bearer ${token}` }
       });
       setData({ ...data, profile: { ...data.profile, isActive: res.isActive } });
       toast.success(res.isActive ? 'You are now LIVE' : 'Status set to BUSY');
    } catch (err) {
       toast.error('Status sync failed');
    }
  };

  const updateBookingStatus = async (id, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_CONFIG.baseUrl}/bookings/${id}/status`, { status }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Session ${status.toLowerCase()}`);
      fetchStaffData();
    } catch (err) {
      toast.error('Update failed');
    }
  };

  if (loading) return <div className="staff-loader"><Activity className="spin" /> Syncing Aero-Portal...</div>;

  return (
    <div className="staff-portal">
      <aside className="staff-sidebar glass">
        <div className="portal-logo">
           <Shield size={24} className="logo-icon" />
           <span>AeroHub</span>
        </div>
        
        <nav className="portal-nav">
          <button className={activeTab === 'queue' ? 'active' : ''} onClick={() => setActiveTab('queue')}><Calendar size={20} /> My Queue</button>
          <button className={activeTab === 'stats' ? 'active' : ''} onClick={() => setActiveTab('stats')}><TrendingUp size={20} /> Performance</button>
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}><User size={20} /> Professional Identity</button>
        </nav>

        <div className="portal-footer">
           <div className="staff-brief">
              <div className="avatar-mini">{user.name[0]}</div>
              <div className="brief-txt">
                 <p>{user.name.split(' ')[0]}</p>
                 <span>ID: {user._id.slice(-6)}</span>
              </div>
           </div>
           <button onClick={logout} className="logout-btn-aero"><LogOut size={18} /> Exit</button>
        </div>
      </aside>

      <main className="staff-main">
        <header className="staff-top-bar glass">
           <div className="greet-aero">
              <h1>Welcome back, <span className="gradient-text">{user.name.split(' ')[0]}</span></h1>
              <p>{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {data.profile.companyId?.name || 'Enterprise'}</p>
           </div>
           
           <div className="top-actions-aero">
              <div className={`status-pill-aero ${data.profile.isActive ? 'online' : 'busy'}`} onClick={toggleStatus}>
                 <Power size={14} /> {data.profile.isActive ? 'Active' : 'Busy'}
              </div>
              <div className="metric-box-aero">
                 <span>Yield</span>
                 <p>₹{data.stats.revenue.toLocaleString()}</p>
              </div>
           </div>
        </header>

        <section className="staff-content-aero">
           {activeTab === 'queue' ? (
              <div className="queue-list">
                 <div className="section-head-aero">
                    <h2>Current Assignments</h2>
                    <span>{data.bookings.filter(b => b.status === 'Confirmed' || b.status === 'Pending').length} Active Tasks</span>
                 </div>
                 
                 <div className="aero-grid">
                    {data.bookings.map(booking => (
                       <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={booking._id} className="aero-task-card glass">
                          <div className="task-header">
                             <div className="client-info-aero">
                                <div className="avatar-task">{booking.customerName[0]}</div>
                                <div>
                                   <h4>{booking.customerName}</h4>
                                   <p>{booking.serviceTitle}</p>
                                </div>
                             </div>
                             <span className={`status-badge-aero ${booking.status.toLowerCase()}`}>{booking.status}</span>
                          </div>
                          
                          <div className="task-meta">
                             <div className="meta-item"><Clock size={16} /> {booking.startTime}</div>
                             <div className="meta-item"><Calendar size={16} /> {new Date(booking.date).toLocaleDateString()}</div>
                          </div>

                          <div className="task-actions-aero">
                             {booking.status === 'Pending' && (
                                <button onClick={() => updateBookingStatus(booking._id, 'Confirmed')} className="aero-btn primary">Accept Session</button>
                             )}
                             {booking.status === 'Confirmed' && (
                                <button onClick={() => updateBookingStatus(booking._id, 'Completed')} className="aero-btn success">Mark Completed</button>
                             )}
                             <button onClick={() => navigate('/workspace')} className="aero-btn ghost"><MessageSquare size={16} /> Chat</button>
                             {['Pending', 'Confirmed'].includes(booking.status) && (
                                <button onClick={() => updateBookingStatus(booking._id, 'Cancelled')} className="aero-btn danger">Cancel</button>
                             )}
                          </div>
                       </motion.div>
                    ))}
                    {data.bookings.length === 0 && <div className="empty-aero glass">No sessions found in your queue.</div>}
                 </div>
              </div>
           ) : activeTab === 'stats' ? (
              <div className="stats-view-aero">
                 <div className="stats-row-aero">
                    <div className="big-stat-card glass">
                       <Activity className="stat-icon-aero" />
                       <div className="stat-body-aero">
                          <p>Career Success Rate</p>
                          <h3>{data.profile.totalBookings > 0 ? Math.round((data.profile.completedBookings / data.profile.totalBookings) * 100) : 100}%</h3>
                       </div>
                    </div>
                    <div className="big-stat-card glass">
                       <UserCheck className="stat-icon-aero" />
                       <div className="stat-body-aero">
                          <p>Customer Satisfaction</p>
                          <h3>{data.stats.rating || '5.0'} / 5.0</h3>
                       </div>
                    </div>
                 </div>
                 
                 <div className="revenue-history glass">
                    <h4>Professional Yield Tracker</h4>
                    <p>Total Revenue Managed: ₹{data.stats.revenue.toLocaleString()}</p>
                    <div className="yield-progress-aero">
                       <div className="yield-fill" style={{ width: '75%' }}></div>
                    </div>
                 </div>
              </div>
           ) : (
              <div className="profile-edit-aero glass">
                 <h3>Professional Summary</h3>
                 <p className="sub-txt">Update your bio and specializations to appear more prominently in searches.</p>
                 
                 <div className="aero-form">
                    <div className="aero-input">
                       <label>Bio / Experience Details</label>
                       <textarea defaultValue={data.profile.bio} placeholder="Enter your professional bio..."></textarea>
                    </div>
                    <div className="aero-input">
                       <label>Specializations (Comma separated)</label>
                       <input type="text" defaultValue={data.profile.specialization?.join(', ')} placeholder="e.g. Cardiology, Radiology" />
                    </div>
                    <button className="aero-btn primary">Save Changes</button>
                 </div>
              </div>
           )}
        </section>
      </main>

      <style jsx>{`
        .staff-portal {
          display: grid;
          grid-template-columns: 280px 1fr;
          height: 100vh;
          background: #f8fafc;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        .staff-sidebar {
          background: white;
          border-right: 1px solid rgba(0,0,0,0.05);
          display: flex;
          flex-direction: column;
          padding: 32px 0;
          z-index: 10;
        }

        .portal-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 32px;
          margin-bottom: 48px;
        }

        .logo-icon { color: var(--primary); }
        .portal-logo span { font-weight: 800; font-size: 1.25rem; letter-spacing: -0.02em; }

        .portal-nav { display: flex; flex-direction: column; gap: 8px; padding: 0 16px; }
        .portal-nav button {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          border-radius: 12px;
          border: none;
          background: transparent;
          color: #64748b;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
        }

        .portal-nav button:hover { background: #f1f5f9; color: var(--primary); }
        .portal-nav button.active { background: var(--primary); color: white; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3); }

        .portal-footer { margin-top: auto; padding: 24px 16px; border-top: 1px solid rgba(0,0,0,0.05); }
        .staff-brief { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding: 0 16px; }
        .avatar-mini { width: 40px; height: 40px; border-radius: 12px; background: #6366f1; color: white; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .brief-txt p { margin: 0; font-weight: 700; font-size: 0.95rem; }
        .brief-txt span { font-size: 0.75rem; color: #94a3b8; }
        .logout-btn-aero { width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; padding: 12px; border: 1px solid #fee2e2; color: #ef4444; background: transparent; border-radius: 10px; cursor: pointer; font-weight: 700; }

        .staff-main { padding: 40px; overflow-y: auto; }
        .staff-top-bar { display: flex; justify-content: space-between; align-items: center; padding: 24px 32px; border-radius: 20px; margin-bottom: 40px; }
        .greet-aero h1 { font-size: 1.8rem; margin: 0 0 4px; }
        .greet-aero p { margin: 0; color: #64748b; font-weight: 500; }

        .top-actions-aero { display: flex; align-items: center; gap: 24px; }
        .status-pill-aero { display: flex; align-items: center; gap: 8px; padding: 8px 16px; border-radius: 100px; font-weight: 700; font-size: 0.85rem; cursor: pointer; transition: all 0.2s; }
        .status-pill-aero.online { background: #f0fdf4; color: #16a34a; }
        .status-pill-aero.busy { background: #fef2f2; color: #ef4444; }
        .metric-box-aero span { font-size: 0.7rem; color: #94a3b8; text-transform: uppercase; font-weight: 800; display: block; }
        .metric-box-aero p { font-size: 1.2rem; font-weight: 800; margin: 0; }

        .section-head-aero { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
        .section-head-aero h2 { font-size: 1.4rem; }
        .section-head-aero span { color: var(--primary); font-weight: 700; font-size: 0.9rem; }

        .aero-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 24px; }
        .aero-task-card { padding: 24px; border-radius: 20px; display: flex; flex-direction: column; gap: 16px; }
        .task-header { display: flex; justify-content: space-between; align-items: flex-start; }
        .client-info-aero { display: flex; align-items: center; gap: 14px; }
        .avatar-task { width: 44px; height: 44px; border-radius: 14px; background: #f1f5f9; color: #64748b; display: flex; align-items: center; justify-content: center; font-weight: 700; }
        .client-info-aero h4 { margin: 0; font-size: 1.1rem; }
        .client-info-aero p { margin: 0; font-size: 0.85rem; color: #64748b; }
        .status-badge-aero { font-size: 0.7rem; font-weight: 800; padding: 4px 10px; border-radius: 100px; text-transform: uppercase; }
        .status-badge-aero.pending { background: #fffbeb; color: #b45309; }
        .status-badge-aero.confirmed { background: #f0f9ff; color: #0369a1; }
        
        .task-meta { display: flex; gap: 16px; }
        .meta-item { display: flex; align-items: center; gap: 6px; font-size: 0.85rem; font-weight: 600; color: #64748b; }

        .task-actions-aero { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 8px; }
        .aero-btn { padding: 10px 14px; border-radius: 10px; border: none; font-weight: 700; font-size: 0.85rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; transition: all 0.2s; }
        .aero-btn.primary { background: var(--primary); color: white; }
        .aero-btn.success { background: #16a34a; color: white; }
        .aero-btn.ghost { background: #f1f5f9; color: #64748b; }
        .aero-btn.danger { background: #fef2f2; color: #ef4444; border: 1px solid #fee2e2; }

        .stats-row-aero { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 24px; }
        .big-stat-card { padding: 32px; border-radius: 24px; display: flex; align-items: center; gap: 24px; }
        .stat-icon-aero { width: 56px; height: 56px; color: var(--primary); }
        .stat-body-aero p { margin: 0; color: #64748b; font-weight: 600; font-size: 0.9rem; }
        .stat-body-aero h3 { margin: 4px 0 0; font-size: 2rem; }

        .revenue-history { padding: 32px; border-radius: 24px; }
        .yield-progress-aero { height: 12px; background: rgba(0,0,0,0.05); border-radius: 100px; margin-top: 24px; overflow: hidden; }
        .yield-fill { height: 100%; background: linear-gradient(90deg, var(--primary), var(--accent)); }

        .staff-loader { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100vh; gap: 16px; font-weight: 700; color: #64748b; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default StaffDashboard;
