import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  TrendingUp, DollarSign, Calendar, Star, Users, Clock,
  CheckCircle, XCircle, AlertCircle, ArrowUpRight, BarChart2, BookOpen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';

const API = API_CONFIG.baseUrl;
const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444'];

const ProviderAnalytics = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [expert, setExpert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [bookingsRes, profileRes] = await Promise.all([
        axios.get(`${API}/bookings/host/all`, { headers }),
        axios.get(`${API}/experts/profile`, { headers })
      ]);

      const allBookings = bookingsRes.data.bookings || [];
      setBookings(allBookings);
      setExpert(profileRes.data);

      if (profileRes.data?._id) {
        const reviewsRes = await axios.get(`${API}/reviews/expert/${profileRes.data._id}`);
        setReviews(reviewsRes.data || []);
      }
    } catch (err) {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // ── Derived Stats ─────────────────────────────────────────────────────────
  const totalRevenue = bookings.filter(b => b.status === 'Completed').reduce((s, b) => s + (b.price || 0), 0);
  const completedCount = bookings.filter(b => b.status === 'Completed').length;
  const cancelledCount = bookings.filter(b => b.status === 'Cancelled').length;
  const pendingCount = bookings.filter(b => b.status === 'Pending').length;
  const confirmedCount = bookings.filter(b => b.status === 'Confirmed').length;
  const completionRate = bookings.length ? Math.round((completedCount / bookings.length) * 100) : 0;
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : 'N/A';

  // ── Revenue by month ──────────────────────────────────────────────────────
  const revenueByMonth = bookings
    .filter(b => b.status === 'Completed')
    .reduce((acc, b) => {
      const month = new Date(b.date).toLocaleString('default', { month: 'short', year: '2-digit' });
      acc[month] = (acc[month] || 0) + (b.price || 0);
      return acc;
    }, {});
  const revenueChartData = Object.entries(revenueByMonth).map(([name, revenue]) => ({ name, revenue })).slice(-6);

  // ── Service breakdown ─────────────────────────────────────────────────────
  const serviceBreakdown = bookings.reduce((acc, b) => {
    if (b.serviceTitle) acc[b.serviceTitle] = (acc[b.serviceTitle] || 0) + 1;
    return acc;
  }, {});
  const serviceChartData = Object.entries(serviceBreakdown).map(([name, value]) => ({ name, value }));

  // ── Status distribution ───────────────────────────────────────────────────
  const statusData = [
    { name: 'Completed', value: completedCount },
    { name: 'Confirmed', value: confirmedCount },
    { name: 'Pending', value: pendingCount },
    { name: 'Cancelled', value: cancelledCount },
  ].filter(d => d.value > 0);

  // ── Upcoming sessions ─────────────────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcomingSessions = bookings
    .filter(b => ['Confirmed', 'Pending'].includes(b.status) && new Date(b.date) >= today)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(0, 5);

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', fontSize: '1.2rem', color: '#6366f1' }}>
      Loading analytics...
    </div>
  );

  return (
    <div className="analytics-container">
      {/* Header */}
      <header className="analytics-header">
        <div>
          <h1>Provider Analytics</h1>
          <p>Performance insights for <strong>{user?.name}</strong></p>
        </div>
        <div className="header-actions">
          <Link to="/hub/dashboard" className="btn btn-outline btn-sm">← Dashboard</Link>
          <Link to="/hub/schedule" className="btn btn-primary btn-sm">Manage Schedule</Link>
        </div>
      </header>

      {/* KPI Cards */}
      <section className="kpi-grid">
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}`, icon: <DollarSign size={22} />, color: 'purple', sub: `from ${completedCount} sessions` },
          { label: 'Total Bookings', value: bookings.length, icon: <Calendar size={22} />, color: 'blue', sub: `${pendingCount} pending` },
          { label: 'Completion Rate', value: `${completionRate}%`, icon: <TrendingUp size={22} />, color: 'green', sub: `${cancelledCount} cancelled` },
          { label: 'Avg. Rating', value: avgRating, icon: <Star size={22} />, color: 'yellow', sub: `${reviews.length} reviews` },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`kpi-card glass ${kpi.color}`}>
            <div className="kpi-icon">{kpi.icon}</div>
            <div className="kpi-info">
              <h2>{kpi.value}</h2>
              <p className="kpi-label">{kpi.label}</p>
              <span className="kpi-sub">{kpi.sub}</span>
            </div>
          </motion.div>
        ))}
      </section>

      {/* Tabs */}
      <div className="tab-bar">
        {['overview', 'bookings', 'reviews'].map(tab => (
          <button key={tab} className={`tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─── */}
      {activeTab === 'overview' && (
        <div className="tab-content">
          <div className="charts-grid">
            {/* Revenue Chart */}
            <div className="chart-card glass">
              <h3><BarChart2 size={18} className="inline mr-2" />Monthly Revenue</h3>
              {revenueChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueChartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="#6366f1" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <div className="empty-chart">No completed bookings yet</div>}
            </div>

            {/* Status Pie */}
            <div className="chart-card glass">
              <h3><BookOpen size={18} className="inline mr-2" />Booking Status</h3>
              {statusData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value">
                      {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : <div className="empty-chart">No bookings data yet</div>}
            </div>
          </div>

          {/* Upcoming Sessions */}
          <div className="upcoming-card glass">
            <h3><Clock size={18} className="inline mr-2" />Upcoming Sessions ({upcomingSessions.length})</h3>
            {upcomingSessions.length > 0 ? (
              <div className="upcoming-list">
                {upcomingSessions.map((b, i) => (
                  <div key={b._id} className="upcoming-item">
                    <div className="up-avatar">{b.customerId?.name?.[0] || '?'}</div>
                    <div className="up-info">
                      <strong>{b.customerId?.name || 'Client'}</strong>
                      <span>{b.serviceTitle}</span>
                    </div>
                    <div className="up-time">
                      <span className="up-date">{new Date(b.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                      <span className="up-clock">{b.startTime}</span>
                    </div>
                    <span className={`status-pill ${b.status.toLowerCase()}`}>{b.status}</span>
                  </div>
                ))}
              </div>
            ) : <p className="empty-text">No upcoming sessions scheduled.</p>}
          </div>

          {/* Services Performance */}
          {serviceChartData.length > 0 && (
            <div className="service-performance glass">
              <h3><Users size={18} className="inline mr-2" />Service Popularity</h3>
              <div className="service-bars">
                {serviceChartData.sort((a, b) => b.value - a.value).map((s, i) => {
                  const max = Math.max(...serviceChartData.map(x => x.value));
                  return (
                    <div key={i} className="service-bar-row">
                      <span className="sb-label">{s.name}</span>
                      <div className="sb-track">
                        <div className="sb-fill" style={{ width: `${(s.value / max) * 100}%` }}></div>
                      </div>
                      <span className="sb-count">{s.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── BOOKINGS TAB ── */}
      {activeTab === 'bookings' && (
        <div className="tab-content">
          <div className="bookings-full glass">
            <div className="bf-header">
              <h3>All Bookings ({bookings.length})</h3>
              <div className="status-legend">
                <span className="pill pending">Pending: {pendingCount}</span>
                <span className="pill confirmed">Confirmed: {confirmedCount}</span>
                <span className="pill completed">Completed: {completedCount}</span>
                <span className="pill cancelled">Cancelled: {cancelledCount}</span>
              </div>
            </div>
            <div className="bf-table">
              <div className="bf-thead">
                <span>Client</span><span>Service</span><span>Date & Time</span><span>Amount</span><span>Status</span>
              </div>
              {bookings.length > 0 ? bookings.map(b => (
                <div key={b._id} className="bf-row">
                  <div className="bf-client">
                    <div className="bf-avatar">{b.customerId?.name?.[0] || '?'}</div>
                    <div>
                      <strong>{b.customerId?.name || 'N/A'}</strong>
                      <small>{b.customerId?.email}</small>
                    </div>
                  </div>
                  <span className="bf-service">{b.serviceTitle}</span>
                  <div className="bf-datetime">
                    <span>{new Date(b.date).toLocaleDateString('en-IN')}</span>
                    <small>{b.startTime} – {b.endTime}</small>
                  </div>
                  <span className="bf-price">₹{b.price}</span>
                  <span className={`status-pill ${b.status.toLowerCase()}`}>{b.status}</span>
                </div>
              )) : <div className="empty-bf">No bookings yet.</div>}
            </div>
          </div>
        </div>
      )}

      {/* ── REVIEWS TAB ── */}
      {activeTab === 'reviews' && (
        <div className="tab-content">
          <div className="reviews-summary glass">
            <div className="rs-score">
              <span className="rs-big">{avgRating}</span>
              <div className="rs-stars">
                {[1,2,3,4,5].map(n => (
                  <span key={n} style={{ color: n <= Math.round(avgRating) ? '#fbbf24' : '#d1d5db', fontSize: '1.4rem' }}>★</span>
                ))}
              </div>
              <small>{reviews.length} reviews</small>
            </div>
          </div>
          <div className="reviews-list">
            {reviews.length > 0 ? reviews.map((r, i) => (
              <div key={i} className="review-card glass">
                <div className="rv-header">
                  <div className="rv-stars">{Array.from({length:5}).map((_, idx) => <span key={idx} style={{ color: idx < r.rating ? '#fbbf24' : '#d1d5db' }}>★</span>)}</div>
                  <span className="rv-date">{new Date(r.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
                <p className="rv-comment">"{r.comment}"</p>
                <small className="rv-author">— {r.customerId?.name || 'Anonymous'}</small>
              </div>
            )) : (
              <div className="empty-reviews glass">
                <Star size={48} color="#d1d5db" />
                <p>No reviews yet. Complete sessions to receive feedback.</p>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .analytics-container { max-width: 1200px; margin: 0 auto; padding: 100px 20px 60px; }
        
        .analytics-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
        .analytics-header h1 { font-size: 2.2rem; margin-bottom: 4px; }
        .analytics-header p { color: var(--text-muted); }
        .header-actions { display: flex; gap: 12px; align-items: center; }

        .kpi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; margin-bottom: 32px; }
        .kpi-card { display: flex; align-items: center; gap: 20px; padding: 24px; border-radius: 20px; }
        .kpi-icon { width: 52px; height: 52px; border-radius: 14px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .kpi-card.purple .kpi-icon { background: rgba(139,92,246,0.12); color: #8b5cf6; }
        .kpi-card.blue   .kpi-icon { background: rgba(59,130,246,0.12); color: #3b82f6; }
        .kpi-card.green  .kpi-icon { background: rgba(34,197,94,0.12); color: #22c55e; }
        .kpi-card.yellow .kpi-icon { background: rgba(251,191,36,0.12); color: #f59e0b; }
        .kpi-info h2 { font-size: 1.8rem; line-height: 1.1; margin-bottom: 2px; }
        .kpi-label { font-weight: 600; color: var(--text-muted); font-size: 0.88rem; }
        .kpi-sub { font-size: 0.78rem; color: var(--text-muted); }

        .tab-bar { display: flex; gap: 4px; background: rgba(0,0,0,0.04); padding: 6px; border-radius: 14px; width: fit-content; margin-bottom: 28px; }
        .tab-btn { padding: 8px 24px; border: none; background: transparent; border-radius: 10px; cursor: pointer; font-weight: 600; color: var(--text-muted); transition: all 0.2s; }
        .tab-btn.active { background: white; color: var(--primary); box-shadow: 0 2px 8px rgba(0,0,0,0.08); }

        .tab-content { display: flex; flex-direction: column; gap: 24px; }

        .charts-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; }
        .chart-card { padding: 28px; border-radius: 20px; }
        .chart-card h3 { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 1rem; }
        .empty-chart { height: 220px; display: flex; align-items: center; justify-content: center; color: var(--text-muted); font-style: italic; }

        .upcoming-card { padding: 28px; border-radius: 20px; }
        .upcoming-card h3 { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 1rem; }
        .upcoming-list { display: flex; flex-direction: column; gap: 12px; }
        .upcoming-item { display: grid; grid-template-columns: auto 1fr auto auto; align-items: center; gap: 16px; padding: 14px 16px; background: rgba(255,255,255,0.5); border-radius: 14px; border: 1px solid var(--glass-border); }
        .up-avatar { width: 38px; height: 38px; background: var(--primary); color: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; font-weight: 700; flex-shrink: 0; }
        .up-info { display: flex; flex-direction: column; }
        .up-info strong { font-size: 0.95rem; }
        .up-info span { font-size: 0.8rem; color: var(--text-muted); }
        .up-time { text-align: right; }
        .up-date { display: block; font-weight: 700; font-size: 0.9rem; }
        .up-clock { font-size: 0.8rem; color: var(--text-muted); }
        .empty-text { color: var(--text-muted); text-align: center; padding: 30px; font-style: italic; }

        .service-performance { padding: 28px; border-radius: 20px; }
        .service-performance h3 { display: flex; align-items: center; gap: 8px; margin-bottom: 20px; font-size: 1rem; }
        .service-bars { display: flex; flex-direction: column; gap: 14px; }
        .service-bar-row { display: grid; grid-template-columns: 180px 1fr 40px; align-items: center; gap: 12px; }
        .sb-label { font-size: 0.9rem; font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .sb-track { background: rgba(0,0,0,0.06); height: 8px; border-radius: 100px; overflow: hidden; }
        .sb-fill { height: 100%; background: var(--primary); border-radius: 100px; transition: width 1s ease; }
        .sb-count { font-weight: 700; color: var(--primary); text-align: right; }

        .bookings-full { padding: 28px; border-radius: 20px; }
        .bf-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 12px; }
        .bf-header h3 { font-size: 1rem; }
        .status-legend { display: flex; gap: 8px; flex-wrap: wrap; }
        .status-legend .pill { padding: 4px 12px; border-radius: 100px; font-size: 0.78rem; font-weight: 600; }
        .pill.pending { background: #fef3c7; color: #d97706; }
        .pill.confirmed { background: #dcfce7; color: #16a34a; }
        .pill.completed { background: #e0f2fe; color: #0369a1; }
        .pill.cancelled { background: #fee2e2; color: #ef4444; }
        .bf-table { display: flex; flex-direction: column; }
        .bf-thead { display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr; padding: 10px 16px; font-size: 0.8rem; font-weight: 700; color: var(--text-muted); text-transform: uppercase; border-bottom: 1px solid var(--glass-border); }
        .bf-row { display: grid; grid-template-columns: 2fr 1.5fr 1.5fr 1fr 1fr; padding: 14px 16px; align-items: center; border-bottom: 1px solid var(--glass-border); transition: background 0.15s; }
        .bf-row:hover { background: rgba(255,255,255,0.4); }
        .bf-client { display: flex; align-items: center; gap: 10px; }
        .bf-avatar { width: 32px; height: 32px; background: var(--primary); color: white; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; font-weight: 700; flex-shrink: 0; }
        .bf-client strong, .bf-client small { display: block; }
        .bf-client small { color: var(--text-muted); font-size: 0.75rem; }
        .bf-datetime span, .bf-datetime small { display: block; }
        .bf-datetime small { color: var(--text-muted); font-size: 0.78rem; }
        .bf-price { font-weight: 700; color: #22c55e; }
        .bf-service { font-size: 0.88rem; font-weight: 500; }
        .empty-bf { text-align: center; padding: 40px; color: var(--text-muted); font-style: italic; }

        .status-pill { padding: 4px 12px; border-radius: 100px; font-size: 0.78rem; font-weight: 600; width: fit-content; }
        .status-pill.pending { background: #fef3c7; color: #d97706; }
        .status-pill.confirmed { background: #dcfce7; color: #16a34a; }
        .status-pill.completed { background: #e0f2fe; color: #0369a1; }
        .status-pill.cancelled { background: #fee2e2; color: #ef4444; }

        .reviews-summary { padding: 32px; border-radius: 20px; display: flex; justify-content: center; }
        .rs-score { display: flex; flex-direction: column; align-items: center; gap: 8px; }
        .rs-big { font-size: 4rem; font-weight: 800; color: #f59e0b; line-height: 1; }
        .rs-stars { font-size: 1.5rem; }
        .reviews-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 16px; }
        .review-card { padding: 24px; border-radius: 16px; }
        .rv-header { display: flex; justify-content: space-between; margin-bottom: 12px; }
        .rv-stars { font-size: 1.1rem; }
        .rv-date { color: var(--text-muted); font-size: 0.8rem; }
        .rv-comment { font-style: italic; color: var(--text-muted); line-height: 1.7; margin-bottom: 10px; }
        .rv-author { font-weight: 600; font-size: 0.85rem; }
        .empty-reviews { padding: 60px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px; border-radius: 20px; }
        .empty-reviews p { color: var(--text-muted); }

        @media (max-width: 900px) {
          .charts-grid { grid-template-columns: 1fr; }
          .analytics-header { flex-direction: column; gap: 16px; }
          .bf-thead, .bf-row { grid-template-columns: 1.5fr 1fr 1fr; }
          .bf-thead span:nth-child(4), .bf-row .bf-price, .bf-thead span:last-child, .bf-row .status-pill { display: none; }
        }
      `}</style>
    </div>
  );
};

export default ProviderAnalytics;
