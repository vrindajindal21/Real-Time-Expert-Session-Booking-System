import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  StickyNote, Plus, Pin, AlertTriangle, Lock, Tag,
  Trash2, Edit3, ChevronDown, ChevronUp, X, Save
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_CONFIG } from '../config/api';

const NOTE_TYPES = [
  { value: 'general',         label: 'General',         color: '#6366f1' },
  { value: 'session_summary', label: 'Session Summary',  color: '#0ea5e9' },
  { value: 'intake',          label: 'Intake',           color: '#22c55e' },
  { value: 'follow_up',       label: 'Follow-up',        color: '#f59e0b' },
  { value: 'medical',         label: 'Medical',          color: '#ef4444' },
  { value: 'legal',           label: 'Legal',            color: '#8b5cf6' },
  { value: 'financial',       label: 'Financial',        color: '#ec4899' },
  { value: 'alert',           label: 'Alert',            color: '#ef4444' },
];

/**
 * ClientNotesPanel
 * Props:
 *   clientId   {string}  The client's user ID
 *   clientName {string}  Display name
 *   bookingId  {string}  Optional — links note to a specific booking
 *   compact    {boolean} If true, renders collapsed by default
 */
const ClientNotesPanel = ({ clientId, clientName, bookingId, compact = false }) => {
  const [notes, setNotes] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(!compact);
  const [showForm, setShowForm] = useState(false);
  const [editingNote, setEditingNote] = useState(null);

  const [form, setForm] = useState({
    noteType: 'general', title: '', content: '', tags: '', isPrivate: false, isAlert: false, isPinned: false
  });

  const token = localStorage.getItem('token');

  const fetchNotes = async () => {
    try {
      setLoading(true);
      const url = bookingId
        ? `${API_CONFIG.baseUrl}/client-notes/booking/${bookingId}`
        : `${API_CONFIG.baseUrl}/client-notes/client/${clientId}`;

      const { data } = await axios.get(url, { headers: { Authorization: `Bearer ${token}` } });
      const noteList = bookingId ? data.data : data.data?.notes || [];
      const alertList = bookingId ? noteList.filter(n => n.isAlert) : data.data?.alerts || [];
      setNotes(noteList);
      setAlerts(alertList);
    } catch {
      // May not have permission — silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (clientId || bookingId) fetchNotes();
  }, [clientId, bookingId]);

  const resetForm = () => setForm({ noteType: 'general', title: '', content: '', tags: '', isPrivate: false, isAlert: false, isPinned: false });

  const handleSubmit = async () => {
    if (!form.content.trim()) { toast.error('Note content is required'); return; }
    try {
      const payload = {
        clientId,
        bookingId,
        noteType: form.noteType,
        title: form.title,
        content: form.content,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        isPrivate: form.isPrivate,
        isAlert: form.isAlert,
        isPinned: form.isPinned
      };

      if (editingNote) {
        await axios.patch(`${API_CONFIG.baseUrl}/client-notes/${editingNote._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Note updated');
      } else {
        await axios.post(`${API_CONFIG.baseUrl}/client-notes`, payload, { headers: { Authorization: `Bearer ${token}` } });
        toast.success('Note saved');
      }

      setShowForm(false);
      setEditingNote(null);
      resetForm();
      fetchNotes();
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to save note');
    }
  };

  const handleDelete = async (noteId) => {
    if (!window.confirm('Delete this note?')) return;
    try {
      await axios.delete(`${API_CONFIG.baseUrl}/client-notes/${noteId}`, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Note deleted');
      fetchNotes();
    } catch { toast.error('Failed to delete'); }
  };

  const startEdit = (note) => {
    setEditingNote(note);
    setForm({
      noteType: note.noteType, title: note.title || '', content: note.content,
      tags: (note.tags || []).join(', '), isPrivate: note.isPrivate,
      isAlert: note.isAlert, isPinned: note.isPinned
    });
    setShowForm(true);
  };

  const typeConfig = (type) => NOTE_TYPES.find(t => t.value === type) || NOTE_TYPES[0];

  return (
    <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>

      {/* Panel Header */}
      <div
        onClick={() => setExpanded(e => !e)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', cursor: 'pointer', userSelect: 'none', background: '#fafafa', borderBottom: expanded ? '1px solid #e2e8f0' : 'none' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <StickyNote size={18} color="#6366f1" />
          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#0f172a' }}>
            Client Notes{clientName ? ` — ${clientName}` : ''}
          </span>
          {alerts.length > 0 && (
            <span style={{ background: '#fee2e2', color: '#ef4444', fontSize: '0.7rem', fontWeight: 800, padding: '2px 8px', borderRadius: '100px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <AlertTriangle size={10} /> {alerts.length} Alert{alerts.length > 1 ? 's' : ''}
            </span>
          )}
          <span style={{ background: '#f1f5f9', color: '#64748b', fontSize: '0.7rem', fontWeight: 700, padding: '2px 8px', borderRadius: '100px' }}>
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={e => { e.stopPropagation(); setShowForm(true); resetForm(); setEditingNote(null); setExpanded(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '5px 10px', background: 'rgba(99,102,241,0.1)', border: 'none', borderRadius: '8px', color: '#6366f1', fontWeight: 700, fontSize: '0.75rem', cursor: 'pointer' }}
          >
            <Plus size={13} /> Add
          </button>
          {expanded ? <ChevronUp size={16} color="#94a3b8" /> : <ChevronDown size={16} color="#94a3b8" />}
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }}
          >
            <div style={{ padding: '16px 20px' }}>

              {/* Alerts Banner */}
              {alerts.length > 0 && (
                <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px' }}>
                  {alerts.map(a => (
                    <div key={a._id} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '6px' }}>
                      <AlertTriangle size={14} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                      <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#dc2626' }}>{a.title || a.content}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit Form */}
              <AnimatePresence>
                {showForm && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{ background: '#f8fafc', borderRadius: '16px', padding: '20px', marginBottom: '20px', border: '1px solid #e2e8f0' }}
                  >
                    <div style={{ display: 'flex', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                      {/* Note type */}
                      <select
                        value={form.noteType}
                        onChange={e => setForm(p => ({ ...p, noteType: e.target.value }))}
                        style={{ padding: '7px 10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.82rem', background: 'white', color: typeConfig(form.noteType).color, fontWeight: 700 }}
                      >
                        {NOTE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                      </select>

                      {/* Toggles */}
                      {[
                        { field: 'isAlert', icon: <AlertTriangle size={12} />, label: 'Alert', activeColor: '#ef4444' },
                        { field: 'isPinned', icon: <Pin size={12} />, label: 'Pin', activeColor: '#6366f1' },
                        { field: 'isPrivate', icon: <Lock size={12} />, label: 'Private', activeColor: '#8b5cf6' },
                      ].map(({ field, icon, label, activeColor }) => (
                        <button key={field}
                          onClick={() => setForm(p => ({ ...p, [field]: !p[field] }))}
                          style={{
                            display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 12px', borderRadius: '10px',
                            border: `1px solid ${form[field] ? activeColor : '#e2e8f0'}`,
                            background: form[field] ? activeColor + '15' : 'white',
                            color: form[field] ? activeColor : '#94a3b8',
                            fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer'
                          }}
                        >
                          {icon} {label}
                        </button>
                      ))}
                    </div>

                    <input
                      value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                      placeholder="Note title (optional)"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.85rem', outline: 'none' }}
                    />
                    <textarea
                      value={form.content} onChange={e => setForm(p => ({ ...p, content: e.target.value }))}
                      placeholder="Write your note here..."
                      rows={4}
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', marginBottom: '10px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.85rem', resize: 'vertical', outline: 'none' }}
                    />
                    <input
                      value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
                      placeholder="Tags: comma separated (e.g. urgent, follow-up)"
                      style={{ width: '100%', boxSizing: 'border-box', padding: '9px 12px', marginBottom: '14px', borderRadius: '10px', border: '1px solid #e2e8f0', fontFamily: 'inherit', fontSize: '0.82rem', outline: 'none' }}
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={handleSubmit} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#6366f1', color: 'white', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                        <Save size={14} /> {editingNote ? 'Update' : 'Save Note'}
                      </button>
                      <button onClick={() => { setShowForm(false); setEditingNote(null); resetForm(); }} style={{ padding: '9px 14px', background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem' }}>
                        <X size={14} />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Notes List */}
              {loading ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '0.85rem' }}>Loading notes...</p>
              ) : notes.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: '0.85rem' }}>No notes yet — add the first one above.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {notes.filter(n => !n.isDeleted).map(note => {
                    const tc = typeConfig(note.noteType);
                    return (
                      <div key={note._id} style={{ borderRadius: '14px', border: `1px solid ${note.isAlert ? '#fecaca' : '#e2e8f0'}`, background: note.isAlert ? '#fff5f5' : 'white', padding: '14px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: tc.color, background: tc.color + '12', padding: '2px 8px', borderRadius: '100px' }}>{tc.label}</span>
                            {note.isPinned && <Pin size={12} color="#6366f1" />}
                            {note.isPrivate && <Lock size={12} color="#8b5cf6" />}
                            {note.isAlert && <AlertTriangle size={12} color="#ef4444" />}
                            {note.title && <span style={{ fontWeight: 700, fontSize: '0.85rem' }}>{note.title}</span>}
                          </div>
                          <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                            <button onClick={() => startEdit(note)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', borderRadius: '6px' }}><Edit3 size={13} /></button>
                            <button onClick={() => handleDelete(note._id)} style={{ padding: '4px', background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', borderRadius: '6px' }}><Trash2 size={13} /></button>
                          </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: '#334155', lineHeight: 1.6, whiteSpace: 'pre-line' }}>{note.content}</p>
                        {note.tags?.length > 0 && (
                          <div style={{ display: 'flex', gap: '5px', marginTop: '10px', flexWrap: 'wrap' }}>
                            {note.tags.map(tag => (
                              <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.68rem', color: '#64748b', background: '#f1f5f9', padding: '2px 8px', borderRadius: '100px', fontWeight: 600 }}>
                                <Tag size={9} /> {tag}
                              </span>
                            ))}
                          </div>
                        )}
                        <p style={{ margin: '8px 0 0', fontSize: '0.72rem', color: '#94a3b8' }}>
                          {note.authorId?.name || 'You'} · {new Date(note.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ClientNotesPanel;
