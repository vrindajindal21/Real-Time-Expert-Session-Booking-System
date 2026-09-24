import React, { useState, useEffect } from 'react';
import { Bell, Check, Trash2, ExternalLink, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';

const NotificationCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // In a real scenario, we would listen for socket events here
      // socket.on('new-notification', (notif) => { ... })
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      const [notifsRes, countRes] = await Promise.all([
        axios.get(`${API_CONFIG.baseUrl}/notifications`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_CONFIG.baseUrl}/notifications/unread-count`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setNotifications(notifsRes.data.data?.notifications || []);
      setUnreadCount(notifsRes.data.data?.unreadCount || countRes.data.data?.unreadCount || 0);
    } catch (err) {
      console.error('Error fetching notifications:', err);
    }
  };

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_CONFIG.baseUrl}/notifications/${id}/read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.map(n => n._id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark as read');
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.patch(`${API_CONFIG.baseUrl}/notifications/mark-all-read`, {}, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  const deleteNotification = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_CONFIG.baseUrl}/notifications/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setNotifications(notifications.filter(n => n._id !== id));
      toast.success('Notification deleted');
    } catch (err) {
      toast.error('Failed to delete notification');
    }
  };

  return (
    <div className="notification-wrapper">
      <button className="notif-trigger" onClick={() => setIsOpen(!isOpen)}>
        <Bell size={20} />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount}</span>}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="notif-overlay-v" onClick={() => setIsOpen(false)}></div>
            <motion.div 
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="notif-dropdown glass"
            >
              <div className="notif-header">
                <h3>Notifications</h3>
                <div className="header-actions">
                  <button className="text-btn" onClick={markAllRead}>Mark all read</button>
                  <button className="close-btn" onClick={() => setIsOpen(false)}><X size={18} /></button>
                </div>
              </div>

              <div className="notif-list">
                {notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <div key={notif._id} className={`notif-item ${notif.isRead ? 'read' : 'unread'}`}>
                      <div className="notif-icon">
                        <div className={`icon-circle ${notif.category}`}>
                          {notif.category === 'booking' ? '📅' : notif.category === 'message' ? '💬' : '🔔'}
                        </div>
                      </div>
                      <div className="notif-content">
                        <div className="notif-title-row">
                          <h4>{notif.title}</h4>
                          <span className="notif-time">{new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p>{notif.message}</p>
                        <div className="notif-actions">
                          {!notif.isRead && (
                            <button onClick={() => markAsRead(notif._id)} title="Mark as read">
                              <Check size={14} />
                            </button>
                          )}
                          <button onClick={() => deleteNotification(notif._id)} title="Delete">
                            <Trash2 size={14} />
                          </button>
                          {notif.actionUrl && (
                            <a href={notif.actionUrl} className="action-link">
                              <ExternalLink size={14} /> View
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="notif-empty">
                    <Bell size={48} color="#e2e8f0" />
                    <p>All clear! No new notifications.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <style jsx>{`
        .notification-wrapper { position: relative; }
        .notif-trigger {
          background: none;
          border: none;
          color: var(--text-main);
          cursor: pointer;
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .notif-trigger:hover { background: rgba(0,0,0,0.05); }
        .notif-badge {
          position: absolute;
          top: 6px;
          right: 6px;
          background: var(--danger);
          color: white;
          font-size: 10px;
          font-weight: 800;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 4px;
          border: 2px solid white;
        }

        .notif-overlay-v {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          z-index: 9999;
        }

        .notif-dropdown {
          position: absolute;
          top: 50px;
          right: -100px;
          width: 360px;
          max-height: 500px;
          z-index: 10000;
          border-radius: 20px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
        }

        .notif-header {
          padding: 18px 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--glass-border);
          background: rgba(255,255,255,0.5);
        }
        .notif-header h3 { font-size: 1rem; font-weight: 800; color: #1e293b; }
        .header-actions { display: flex; gap: 12px; align-items: center; }
        .text-btn { background: none; border: none; font-size: 0.75rem; color: var(--primary); font-weight: 700; cursor: pointer; }
        .close-btn { background: none; border: none; color: #94a3b8; cursor: pointer; }

        .notif-list { overflow-y: auto; flex: 1; }
        .notif-item {
          padding: 16px 20px;
          display: flex;
          gap: 16px;
          border-bottom: 1px solid rgba(241, 245, 249, 0.5);
          transition: all 0.2s;
        }
        .notif-item.unread { background: rgba(99, 102, 241, 0.03); }
        .notif-item:hover { background: rgba(241, 245, 249, 0.8); }

        .icon-circle {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
        }
        .icon-circle.booking { background: #dcfce7; }
        .icon-circle.message { background: #e0e7ff; }
        .icon-circle.system { background: #fef3c7; }

        .notif-content { flex: 1; }
        .notif-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 4px; }
        .notif-title-row h4 { font-size: 0.85rem; font-weight: 800; color: #1e293b; }
        .notif-time { font-size: 0.7rem; color: #94a3b8; font-weight: 600; }
        .notif-content p { font-size: 0.8rem; color: #64748b; margin-bottom: 8px; line-height: 1.4; }

        .notif-actions { display: flex; gap: 8px; }
        .notif-actions button, .action-link {
          background: #f1f5f9;
          border: none;
          color: #64748b;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 0.7rem;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
          font-weight: 600;
        }
        .notif-actions button:hover { background: #e2e8f0; color: #1e293b; }
        .action-link { background: var(--primary); color: white; }

        .notif-empty { padding: 48px 0; display: flex; flex-direction: column; align-items: center; gap: 16px; color: #94a3b8; text-align: center; }
        .notif-empty p { font-size: 0.9rem; font-weight: 600; }
      `}</style>
    </div>
  );
};

export default NotificationCenter;
