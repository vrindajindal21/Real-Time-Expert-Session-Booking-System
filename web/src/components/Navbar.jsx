import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Search } from 'lucide-react';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [time, setTime] = useState(new Date());

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

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar glass">
      <div className="nav-content">
        <Link to="/" className="logo">
          <span className="logo-icon">✨</span>
          <span className="gradient-text">BookingHub</span>
        </Link>

        <div className="nav-links">
          {user && (
            <div className="global-greeting">
              <span className="g-text">{getGreeting()}, {user.name.split(' ')[0].charAt(0).toUpperCase() + user.name.split(' ')[0].slice(1)}</span>
              <span className="g-time">{time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          )}

          <Link to="/search" className="nav-item">
            <Search size={18} /> Explore
          </Link>
          
          {user && (
            <Link to="/messages" className="nav-item">
               Messages
            </Link>
          )}
          
          {user ? (
            <>
              <Link to="/workspace" className="nav-item">
                <LayoutDashboard size={18} /> Workspace
              </Link>
              <NotificationCenter />
              <Link 
                to={user.role === 'admin' ? '/admin' : (user.role === 'company_staff' ? '/staff/dashboard' : (['expert', 'company_owner', 'provider'].includes(user.role) ? '/hub/dashboard' : '/dashboard'))} 
                className="nav-item"
              >
                Dashboard 
                <span className={`role-badge ${['expert', 'company_owner', 'company_staff', 'provider'].includes(user.role) ? 'expert' : user.role}`}>
                  {user.role === 'company_staff' ? 'Staff Hub' : (['expert', 'company_owner', 'provider'].includes(user.role) ? 'Provider' : (user.role === 'admin' ? 'Admin' : 'Personal'))}
                </span>
              </Link>
              <div className="user-profile">
                <div className="avatar">
                  {user.name[0]}
                </div>
                <button onClick={handleLogout} className="logout-btn">
                  <LogOut size={18} />
                </button>
              </div>
            </>
          ) : (
            <div className="auth-btns">
              <Link to="/login" className="nav-item">Login</Link>
              <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .navbar {
          position: fixed;
          top: 20px;
          left: 20px;
          right: 20px;
          z-index: 10000;
          border-radius: 20px;
          padding: 12px 24px;
          pointer-events: none; /* Allow clicks to pass through transparent gap */
        }

        .nav-content {
          max-width: 1200px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          pointer-events: auto; /* Re-enable for the actual bar */
        }

        .logo {
          font-size: 1.5rem;
          font-weight: 700;
          text-decoration: none;
          color: var(--text-main);
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 24px;
        }

        .nav-item {
          text-decoration: none;
          color: var(--text-muted);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: color 0.2s;
        }

        .nav-item:hover {
          color: var(--primary);
        }

        .auth-btns {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .btn-sm {
          padding: 8px 16px;
          font-size: 0.9rem;
        }

        .user-profile {
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 1px solid var(--glass-border);
          padding-left: 20px;
        }

        .avatar {
          width: 36px;
          height: 36px;
          background: var(--primary);
          color: white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }

        .logout-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          padding: 8px;
          border-radius: 8px;
          transition: background 0.2s;
        }

        .logout-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
        }

        .role-badge {
          font-size: 0.7rem;
          padding: 2px 8px;
          border-radius: 100px;
          font-weight: 700;
          text-transform: uppercase;
          margin-left: 6px;
          letter-spacing: 0.05em;
        }
        .role-badge.expert { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .role-badge.user { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .role-badge.admin { background: #faf5ff; color: #7e22ce; border: 1px solid #f3e8ff; }
        
        .global-greeting {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          margin-right: 12px;
          border-right: 1px solid var(--glass-border);
          padding-right: 20px;
        }

        .g-text {
          font-weight: 600;
          font-size: 0.85rem;
          color: var(--text-main);
        }

        .g-time {
          font-size: 0.75rem;
          color: var(--text-muted);
          font-family: inherit;
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
