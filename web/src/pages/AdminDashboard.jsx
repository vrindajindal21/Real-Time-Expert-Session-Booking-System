import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import { ShieldCheck, Users, Briefcase, Activity, AlertCircle, TrendingUp, Search, Trash2, Ban, CheckCircle } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { buildUrl, API_ENDPOINTS, REQUEST_CONFIG } from '../config/api';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [time, setTime] = useState(new Date());
  const [stats, setStats] = useState({ users: 0, experts: 0, bookings: 0, revenue: 0, monthlyTrend: [] });
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

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

  useEffect(() => {
    fetchAdminData();
  }, [filter, search]);

  const fetchAdminData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = REQUEST_CONFIG.addAuthHeader(token);
      
      const [statsRes, usersRes] = await Promise.all([
        axios.get(buildUrl(API_ENDPOINTS.ADMIN.STATS), { headers }),
        axios.get(buildUrl(API_ENDPOINTS.ADMIN.USERS) + `?role=${filter}&search=${search}`, { headers })
      ]);
      
      setStats(statsRes.data);
      setAllUsers(usersRes.data.users);
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync admin data');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpertApproval = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(buildUrl(API_ENDPOINTS.ADMIN.TOGGLE_EXPERT, { id }), {}, {
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      toast.success('Provider status updated');
      fetchAdminData();
    } catch (err) {
      toast.error('Failed to update provider');
    }
  };

  const toggleUserBan = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(buildUrl(API_ENDPOINTS.ADMIN.BAN_USER, { id }), {}, {
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      toast.success('User access updated');
      fetchAdminData();
    } catch (err) {
      toast.error('Action failed');
    }
  };

  const deleteUser = async (id) => {
    if(!window.confirm('Permanently delete this user?')) return;
    try {
      const token = localStorage.getItem('token');
      await axios.delete(buildUrl(API_ENDPOINTS.ADMIN.DELETE_USER, { id }), {
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      toast.success('User removed');
      fetchAdminData();
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="admin-container">
      <header className="admin-header">
        <div className="title-row">
          <ShieldCheck size={32} className="admin-icon" />
          <h1>{getGreeting()}, <span className="gradient-text">{user.name}</span></h1>
        </div>
        <p>{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} | Operational overview for {user.name} (Super Admin)</p>
      </header>

      <div className="stats-row">
        <div className="admin-stat glass">
          <TrendingUp className="stat-glow" />
          <h3>₹{stats.revenue.toLocaleString()}</h3>
          <p>Gross Platform Revenue</p>
        </div>
        <div className="admin-stat glass">
          <Users color="#6366f1" />
          <h3>{stats.users}</h3>
          <p>Total Registered Users</p>
        </div>
        <div className="admin-stat glass">
          <Briefcase color="#ec4899" />
          <h3>{stats.experts}</h3>
          <p>Active Service Providers</p>
        </div>
        <div className="admin-stat glass">
          <Activity color="#a855f7" />
          <h3>{stats.bookings}</h3>
          <p>Successful Bookings</p>
        </div>
      </div>

      <div className="charts-row glass">
        <h2>Revenue & Booking Growth</h2>
        <div style={{ width: '100%', height: 300, marginTop: '20px' }}>
          <ResponsiveContainer>
            <AreaChart data={stats.monthlyTrend}>
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
              />
              <Area type="monotone" dataKey="revenue" stroke="#6366f1" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <main className="admin-content">
        <div className="user-management glass">
          <div className="section-header">
            <div>
              <h2>User & Provider Management</h2>
              <div className="search-bar">
                <Search size={16} />
                <input 
                  type="text" 
                  placeholder="Search by name or email..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="filter-chips">
              {['all', 'user', 'expert', 'admin'].map(r => (
                <span 
                  key={r}
                  className={`chip ${filter === r ? 'active' : ''}`}
                  onClick={() => setFilter(r)}
                >
                  {r.charAt(0).toUpperCase() + r.slice(1)}s
                </span>
              ))}
            </div>
          </div>

          <div className="user-table">
            <div className="table-header">
              <span>Identity</span>
              <span>Role</span>
              <span>Joined</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            
            {loading ? (
              <div className="loading-row">Synchronizing database...</div>
            ) : allUsers.length > 0 ? allUsers.map((u) => (
              <motion.div 
                key={u._id} 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="table-row"
              >
                <div className="user-info">
                  <div className="avatar-admin">{u.name?.[0] || 'U'}</div>
                  <div>
                    <span className="name-bold">{u.name || 'Unknown User'}</span>
                    <span className="email-muted">{u.email}</span>
                  </div>
                </div>
                <div className={`role-badge ${u.role}`}>{u.role}</div>
                <div className="date-cell">{new Date(u.createdAt).toLocaleDateString()}</div>
                <div className="status-cell">
                   <span className={`status-indicator ${u.isActive ? 'online' : 'offline'}`}></span> 
                   {u.isActive ? 'Active' : 'Banned'}
                </div>
                <div className="action-cell">
                  {u.role === 'expert' && (
                    <button onClick={() => toggleExpertApproval(u._id)} className="btn-toggle">
                      {u.isApproved ? 'Suspend' : 'Approve'}
                    </button>
                  )}
                  <button onClick={() => toggleUserBan(u._id)} className="btn-icon" title={u.isActive ? 'Ban' : 'Unban'}>
                    <Ban size={16} color={u.isActive ? '#ef4444' : '#22c55e'} />
                  </button>
                  <button onClick={() => deleteUser(u._id)} className="btn-icon danger">
                    <Trash2 size={16} />
                  </button>
                </div>
              </motion.div>
            )) : (
              <div className="empty-state">No users matching criteria</div>
            )}
          </div>
        </div>
      </main>

      <style jsx>{`
        .admin-container {
          max-width: 1400px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        .admin-header {
          margin-bottom: 48px;
        }

        .title-row {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 8px;
        }

        .admin-icon {
          color: var(--primary);
        }

        .admin-header h1 {
          font-size: 2.5rem;
          margin: 0;
        }

        .admin-header p {
          color: var(--text-muted);
          font-weight: 500;
        }

        .stats-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 24px;
          margin-bottom: 48px;
        }

        .admin-stat {
          padding: 32px;
          border-radius: 24px;
          position: relative;
          overflow: hidden;
        }

        .stat-glow {
          position: absolute;
          right: -20px;
          top: -20px;
          width: 100px;
          height: 100px;
          color: rgba(99, 102, 241, 0.05);
          transform: rotate(-15deg);
        }

        .admin-stat h3 {
          font-size: 2.25rem;
          margin: 12px 0 4px;
        }

        .admin-stat p {
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.95rem;
        }

        .charts-row {
          margin-bottom: 48px;
          padding: 32px;
          border-radius: 32px;
        }

        .charts-row h2 {
          font-size: 1.5rem;
          margin-bottom: 24px;
        }

        .user-management {
          padding: 40px;
          border-radius: 32px;
        }

        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 40px;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(0,0,0,0.05);
          padding: 10px 20px;
          border-radius: 12px;
          margin-top: 16px;
          width: 300px;
        }

        .search-bar input {
          border: none;
          background: transparent;
          outline: none;
          width: 100%;
          font-size: 0.9rem;
        }

        .filter-chips {
          display: flex;
          gap: 12px;
        }

        .chip {
          padding: 8px 20px;
          border-radius: 100px;
          background: rgba(0,0,0,0.05);
          cursor: pointer;
          font-weight: 600;
          font-size: 0.85rem;
          transition: all 0.2s;
        }

        .chip.active {
          background: var(--primary);
          color: white;
        }

        .user-table {
          display: flex;
          flex-direction: column;
        }

        .table-header {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
          padding: 0 20px 20px;
          color: var(--text-muted);
          font-weight: 700;
          font-size: 0.85rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          border-bottom: 2px solid var(--glass-border);
        }

        .table-row {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr 1.5fr;
          padding: 24px 20px;
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
          gap: 16px;
        }

        .avatar-admin {
          width: 44px;
          height: 44px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          color: white;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 1.25rem;
        }

        .name-bold {
          display: block;
          font-weight: 700;
          font-size: 1.05rem;
        }

        .email-muted {
          display: block;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .role-badge {
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.75rem;
          font-weight: 800;
          text-transform: uppercase;
          width: fit-content;
        }

        .role-badge.user { background: #e0f2fe; color: #0369a1; }
        .role-badge.expert { background: #fef3c7; color: #b45309; }
        .role-badge.admin { background: #fce7f3; color: #be185d; }

        .status-cell {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .status-indicator {
          width: 8px;
          height: 8px;
          border-radius: 50%;
        }

        .status-indicator.online { background: var(--success); box-shadow: 0 0 8px var(--success); }
        .status-indicator.offline { background: var(--danger); box-shadow: 0 0 8px var(--danger); }

        .action-cell {
          display: flex;
          gap: 8px;
        }

        .btn-toggle {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1px solid var(--glass-border);
          background: white;
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          white-space: nowrap;
        }

        .btn-icon {
          padding: 8px;
          border-radius: 10px;
          border: 1px solid var(--glass-border);
          background: white;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }

        .btn-icon:hover { background: #f8fafc; }
        .btn-icon.danger:hover { background: #fee2e2; color: var(--danger); }

        .empty-state {
          padding: 40px;
          text-align: center;
          color: var(--text-muted);
        }

        @media (max-width: 1024px) {
          .table-header, .table-row { grid-template-columns: 2fr 1fr 1fr; }
          .date-cell, .status-cell { display: none; }
        }
      `}</style>
    </div>
  );
};

export default AdminDashboard;
