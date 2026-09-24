import React, { useState, useEffect } from 'react';
import { 
  BarChart2, Shield, MessageSquare, Lock, Search, 
  TrendingUp, Zap, CheckCircle, Clock, User
} from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { buildUrl, API_ENDPOINTS, REQUEST_CONFIG } from '../config/api';

const Workspace = () => {
  const { user } = useAuth();
  const [activeBoard, setActiveBoard] = useState('tasks');
  const [staff, setStaff] = useState([]);
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());

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
    if (activeBoard === 'directory') {
      fetchStaff();
    }
  }, [activeBoard]);

  const fetchStaff = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Update: use correct profile endpoint and buildUrl
      const expertRes = await axios.get(buildUrl(API_ENDPOINTS.EXPERTS.PROFILE), { 
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      const expertId = expertRes.data._id;

      // Update: use correct staff endpoint and buildUrl
      const res = await axios.get(buildUrl(API_ENDPOINTS.EXPERTS.STAFF, { expertId }), {
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      setStaff(res.data || []);
    } catch (err) {
      console.error('Error fetching staff:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="workspace-container corporate">
      <aside className="workspace-sidebar">
        <div className="sidebar-header">
           <Shield size={22} color="var(--primary)" />
           <span>INTERNAL Hub</span>
        </div>
        <nav className="sidebar-nav">
           <button className={`nav-item ${activeBoard === 'tasks' ? 'active' : ''}`} onClick={() => setActiveBoard('tasks')}>
             <BarChart2 size={18} /> My Dashboard
           </button>
           {user?.role !== 'user' && (
             <button className={`nav-item ${activeBoard === 'directory' ? 'active' : ''}`} onClick={() => setActiveBoard('directory')}>
               <MessageSquare size={18} /> Staff Directory
             </button>
           )}
           <button className={`nav-item ${activeBoard === 'security' ? 'active' : ''}`} onClick={() => setActiveBoard('security')}>
             <Lock size={18} /> Security & Policy
           </button>
        </nav>
        <div className="sidebar-org-status">
           <div className="status-dot"></div>
           <span>Secure Connection</span>
        </div>
      </aside>

      <main className="workspace-main">
        <header className="workspace-top-bar">
          <div className="search-box-v">
             <Search size={16} />
             <input type="text" placeholder="Search internal knowledge base..." />
          </div>
          <div className="top-actions">
             <div className="avatar-v">{user?.name ? user.name[0] : 'U'}</div>
          </div>
        </header>

        <section className="workspace-content">
          <div className="content-header">
            <h1>{getGreeting()}, <span className="gradient-text">{user?.name || 'User'}</span></h1>
            <p className="sub">{time.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })} • {time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} | Pulse: Organization Status - Healthy</p>
          </div>

          {activeBoard === 'tasks' && (
            <div className="corp-grid">
               <div className="corp-panel glass">
                  <div className="p-header">
                     <h3>Corporate Pulse</h3>
                     <TrendingUp size={16} color="var(--primary)" />
                  </div>
                  <div className="empty-state-corp">
                     <TrendingUp size={48} color="#e2e8f0" />
                     <p>No active announcements or strategy updates at the moment.</p>
                  </div>
               </div>

               <div className="corp-panel glass">
                  <div className="p-header">
                     <h3>Active Initiatives</h3>
                     <Zap size={16} color="#f59e0b" />
                  </div>
                  <div className="empty-state-corp">
                     <CheckCircle size={48} color="#e2e8f0" />
                     <p>All clear! You have no pending initiatives or tasks.</p>
                  </div>
               </div>
            </div>
          )}

          {activeBoard === 'directory' && user?.role !== 'user' && (
             <div className="corp-panel glass">
                <div className="p-header">
                   <h3>Organization Staff Network</h3>
                   <MessageSquare size={16} color="var(--primary)" />
                </div>
                {loading ? (
                  <div className="loading-v">Syncing secure directory...</div>
                ) : staff.length > 0 ? (
                  <div className="staff-directory-grid">
                     {staff.map(member => (
                       <div key={member._id} className="staff-card-v anim-fade">
                          <div className="s-avatar">
                             {member.name?.[0] || 'U'}
                          </div>
                          <div className="s-info">
                             <h4>{member.name || 'Unknown'}</h4>
                             <p className="s-role">{member.category}</p>
                             <span className="s-email">{member.email}</span>
                          </div>
                          <div className="s-status">
                             <div className="status-dot"></div> Active
                          </div>
                       </div>
                     ))}
                  </div>
                ) : (
                  <div className="empty-state-corp" style={{marginTop: '20px'}}>
                     <User size={48} color="#e2e8f0" />
                     <p>No internal staff matches or organization is void.</p>
                  </div>
                )}
             </div>
          )}

          {activeBoard === 'security' && (
            <div className="corp-panel glass">
               <div className="p-header">
                  <h3>Security & Policy</h3>
                  <Lock size={16} color="var(--primary)" />
               </div>
               <div className="empty-state-corp">
                  <p>Security guidelines and corporate policies are up to date.</p>
               </div>
            </div>
          )}
        </section>
      </main>

      <style jsx>{`
        .workspace-container.corporate {
          display: flex;
          height: 100vh;
          background: #fdfdfd;
          overflow: hidden;
          width: 100%;
        }

        .workspace-sidebar {
          width: 260px;
          background: #0b0e14;
          color: white;
          padding: 100px 24px 24px 24px;
          display: flex;
          flex-direction: column;
        }

        .sidebar-header {
          display: flex;
          align-items: center;
          gap: 12px;
          font-weight: 800;
          font-size: 0.9rem;
          letter-spacing: 1px;
          margin-bottom: 48px;
        }

        .nav-item {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 16px;
          background: none;
          border: none;
          color: #94a3b8;
          font-weight: 600;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s;
          margin-bottom: 4px;
        }

        .nav-item:hover, .nav-item.active {
          background: rgba(255,255,255,0.05);
          color: white;
        }

        .sidebar-org-status {
          margin-top: auto;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.75rem;
          color: #4ade80;
          font-weight: 700;
        }

        .status-dot { width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80; }

        .workspace-main { flex: 1; display: flex; flex-direction: column; overflow-y: auto; background: #f8fafc; padding-top: 80px; }
        .workspace-top-bar { height: 72px; background: white; border-bottom: 1px solid #e2e8f0; display: flex; align-items: center; justify-content: space-between; padding: 0 40px; }
        .search-box-v { display: flex; align-items: center; gap: 12px; color: #94a3b8; background: #f1f5f9; padding: 10px 16px; border-radius: 12px; width: 300px; }
        .search-box-v input { border: none; background: none; outline: none; flex: 1; font-size: 0.85rem; }
        .avatar-v { width: 40px; height: 40px; background: var(--primary); color: white; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; }

        .workspace-content { padding: 40px; max-width: 1200px; }
        .content-header h1 { font-size: 2.2rem; margin-bottom: 4px; }
        .content-header .sub { color: #64748b; font-weight: 600; margin-bottom: 40px; }

        .corp-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        .corp-panel { padding: 32px; border-radius: 24px; min-height: 400px; border: 1px solid #e2e8f0; }
        .p-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; border-bottom: 1px solid #f1f5f9; padding-bottom: 16px; }
        .p-header h3 { font-size: 1.1rem; font-weight: 800; text-transform: uppercase; color: #1e293b; letter-spacing: 0.5px; }

        .empty-state-corp { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #94a3b8; height: 200px; gap: 16px; font-weight: 500; font-size: 0.95rem; }

        .staff-directory-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .staff-card-v {
          padding: 20px;
          border-radius: 16px;
          background: rgba(255,255,255,0.4);
          border: 1px solid rgba(0,0,0,0.05);
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s;
        }
        .staff-card-v:hover { background: white; transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
        .s-avatar { width: 48px; height: 48px; background: #f1f5f9; border-radius: 12px; display: flex; align-items: center; justify-content: center; font-weight: 800; color: var(--primary); }
        .s-info h4 { font-size: 0.95rem; font-weight: 800; color: #1e293b; margin-bottom: 2px; }
        .s-info .s-role { font-size: 0.75rem; color: #64748b; font-weight: 700; text-transform: uppercase; }
        .s-info .s-email { font-size: 0.8rem; color: #94a3b8; }
        .s-status { margin-left: auto; font-size: 0.7rem; color: #4ade80; font-weight: 700; display: flex; align-items: center; gap: 4px; }
        .loading-v { color: #94a3b8; font-weight: 600; text-align: center; padding: 40px; }
      `}</style>
    </div>
  );
};

export default Workspace;
