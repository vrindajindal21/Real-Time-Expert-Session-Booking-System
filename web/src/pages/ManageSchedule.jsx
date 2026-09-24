import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Plus, Trash2, Save } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';

const ManageSchedule = () => {
  const [slots, setSlots] = useState([]);
  const [newSlot, setNewSlot] = useState({ 
    date: '', 
    startHour: '09', startMin: '00', startPeriod: 'AM',
    endHour: '10', endMin: '00', endPeriod: 'AM' 
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const token = localStorage.getItem('token');
      const { data } = await axios.get(`${API_CONFIG.baseUrl}/experts/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSlots(data.timeSlots || []);
    } catch (err) {
      toast.error('Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  const convertTo24h = (h, m, p) => {
    let hour = parseInt(h);
    if (p === 'PM' && hour !== 12) hour += 12;
    if (p === 'AM' && hour === 12) hour = 0;
    return `${hour.toString().padStart(2, '0')}:${m}`;
  };

  const addSlot = async () => {
    if (!newSlot.date) return toast.error('Please select a date');

    const startTime = convertTo24h(newSlot.startHour, newSlot.startMin, newSlot.startPeriod);
    const endTime = convertTo24h(newSlot.endHour, newSlot.endMin, newSlot.endPeriod);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_CONFIG.baseUrl}/experts/slots`, { 
        date: newSlot.date, 
        startTime, 
        endTime 
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Slot added successfully');
      fetchSlots();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not add slot');
    }
  };

  const deleteSlot = (slotId) => {
    if (!window.confirm('Delete this availability slot?')) return;
    deleteSlotConfirm(slotId);
  };

  const deleteSlotConfirm = async (slotId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_CONFIG.baseUrl}/experts/slots/${slotId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Slot removed');
      fetchSlots();
    } catch (err) {
      toast.error('Failed to remove slot');
    }
  };

  const formatTimeAMPM = (timeStr) => {
    if (!timeStr) return '';
    let [hours, minutes] = timeStr.split(':');
    hours = parseInt(hours);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes} ${ampm}`;
  };

  const clearAllSlots = async () => {
    if (!window.confirm('Are you sure you want to delete ALL availability slots? This cannot be undone.')) return;
    
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API_CONFIG.baseUrl}/experts/slots/clear`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('All slots cleared');
      setSlots([]);
    } catch (err) {
      toast.error('Failed to clear slots');
    }
  };

  return (
    <div className="schedule-container">
      <div className="glass schedule-card">
        <header className="schedule-header">
          <h2><Calendar className="mr-2" /> Manage Availability</h2>
          <p>Set your working hours for clients to book sessions</p>
        </header>

        <section className="add-slot-form">
          <div className="form-grid">
            <div className="input-field">
              <label>Date</label>
              <input 
                type="date" 
                value={newSlot.date} 
                onChange={e => setNewSlot({...newSlot, date: e.target.value})} 
                min={new Date().toISOString().split('T')[0]}
              />
            </div>
            
            <div className="input-field">
              <label><Clock size={16} className="inline mr-1" /> Start Time</label>
              <div className="time-select-group">
                <select value={newSlot.startHour} onChange={e => setNewSlot({...newSlot, startHour: e.target.value})}>
                  {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select value={newSlot.startMin} onChange={e => setNewSlot({...newSlot, startMin: e.target.value})}>
                  {Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={newSlot.startPeriod} onChange={e => setNewSlot({...newSlot, startPeriod: e.target.value})}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <div className="input-field">
              <label><Clock size={16} className="inline mr-1" /> End Time</label>
              <div className="time-select-group">
                <select value={newSlot.endHour} onChange={e => setNewSlot({...newSlot, endHour: e.target.value})}>
                  {Array.from({length: 12}, (_, i) => (i + 1).toString().padStart(2, '0')).map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                <select value={newSlot.endMin} onChange={e => setNewSlot({...newSlot, endMin: e.target.value})}>
                  {Array.from({length: 60}, (_, i) => i.toString().padStart(2, '0')).map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <select value={newSlot.endPeriod} onChange={e => setNewSlot({...newSlot, endPeriod: e.target.value})}>
                  <option value="AM">AM</option>
                  <option value="PM">PM</option>
                </select>
              </div>
            </div>

            <button className="btn btn-primary" onClick={addSlot}>
              <Plus size={18} /> Add Slot
            </button>
          </div>
        </section>

        <section className="slots-list">
          <div className="section-header">
            <h3>Your Current Slots</h3>
            {slots.length > 0 && (
              <button className="btn-clear-all" onClick={clearAllSlots}>
                <Trash2 size={16} className="mr-1" /> Delete All
              </button>
            )}
          </div>
          <div className="slots-grid">
            {slots.length > 0 ? slots.map(slot => (
              <div key={slot._id} className={`slot-item ${slot.isBooked ? 'booked' : ''}`}>
                <div className="slot-info">
                  <div className="slot-date">{new Date(slot.date).toLocaleDateString()}</div>
                  <div className="slot-time">
                    {formatTimeAMPM(slot.startTime)} - {formatTimeAMPM(slot.endTime)}
                  </div>
                  {slot.isBooked && <span className="booked-tag">Booked</span>}
                </div>
                {!slot.isBooked && (
                  <button className="delete-btn" onClick={() => deleteSlot(slot._id)}>
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )) : (
              <div className="empty-state">No slots defined yet. Start adding above!</div>
            )}
          </div>
        </section>
      </div>

      <style jsx>{`
        .schedule-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 100px 20px 40px;
        }
        .schedule-card {
          padding: 40px;
          border-radius: 24px;
        }
        .schedule-header { margin-bottom: 32px; }
        .schedule-header h2 { display: flex; align-items: center; font-size: 1.8rem; margin-bottom: 8px; }
        .schedule-header p { color: var(--text-muted); }
        
        .add-slot-form {
          background: rgba(255,255,255,0.3);
          padding: 24px;
          border-radius: 16px;
          margin-bottom: 40px;
        }
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr auto;
          gap: 16px;
          align-items: flex-end;
        }
        .input-field label { display: block; font-size: 0.85rem; font-weight: 600; margin-bottom: 8px; }
        .input-field input { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--glass-border); }
        .time-select-group { display: flex; gap: 4px; }
        .time-select-group select { padding: 10px 4px; border-radius: 8px; border: 1px solid var(--glass-border); background: white; font-weight: 600; cursor: pointer; }
        .time-preview { display: block; font-size: 0.75rem; color: var(--primary); font-weight: 700; margin-top: 4px; height: 16px; }
        
        .slots-list h3 { margin-bottom: 0; font-size: 1.2rem; }
        .section-header { 
          display: flex; 
          justify-content: space-between; 
          align-items: center; 
          margin-bottom: 20px; 
        }
        .btn-clear-all {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.2);
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 0.85rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          transition: all 0.2s;
        }
        .btn-clear-all:hover {
          background: #ef4444;
          color: white;
        }

        .slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 16px; }
        
        .slot-item {
          padding: 16px;
          border-radius: 12px;
          background: white;
          border: 1px solid var(--glass-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
          position: relative;
        }
        .slot-item.booked { background: #f8fafc; opacity: 0.7; }
        .slot-date { font-weight: 700; font-size: 0.9rem; }
        .slot-time { color: var(--text-muted); font-size: 0.85rem; }
        .booked-tag { position: absolute; top: -10px; right: 10px; background: #16a34a; color: white; font-size: 0.7rem; padding: 2px 8px; border-radius: 100px; }
        
        .delete-btn { background: none; border: none; color: #ef4444; cursor: pointer; padding: 8px; border-radius: 6px; }
        .delete-btn:hover { background: rgba(239, 68, 68, 0.1); }
        
        .empty-state { grid-column: 1/-1; text-align: center; padding: 40px; color: var(--text-muted); font-style: italic; }
      `}</style>
    </div>
  );
};

export default ManageSchedule;
