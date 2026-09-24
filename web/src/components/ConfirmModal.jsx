import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

/**
 * ConfirmModal — replaces all window.confirm() dialogs
 *
 * Props:
 *   open        {boolean}   show/hide
 *   title       {string}    dialog title
 *   message     {string}    body message
 *   confirmText {string}    confirm button label (default "Confirm")
 *   danger      {boolean}   if true, confirm button is red
 *   onConfirm   {function}  called when user clicks confirm
 *   onCancel    {function}  called when user clicks cancel or clicks outside
 */
const ConfirmModal = ({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  danger = false,
  onConfirm,
  onCancel
}) => (
  <AnimatePresence>
    {open && (
      <div
        onClick={onCancel}
        style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.45)',
          backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9000
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 10 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          onClick={e => e.stopPropagation()}
          style={{
            width: '420px', maxWidth: '90vw',
            background: 'white',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 30px 80px rgba(0,0,0,0.2)',
            display: 'flex', flexDirection: 'column', gap: '20px'
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: danger ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                <AlertTriangle size={22} color={danger ? '#ef4444' : '#f59e0b'} />
              </div>
              <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800, color: '#0f172a' }}>
                {title}
              </h3>
            </div>
            <button
              onClick={onCancel}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}
            >
              <X size={20} />
            </button>
          </div>

          {/* Message */}
          <p style={{ margin: 0, fontSize: '0.95rem', color: '#475569', lineHeight: 1.6 }}>
            {message}
          </p>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '12px', borderRadius: '14px',
                border: '2px solid #e2e8f0', background: 'none',
                fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
                color: '#64748b', transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.background = '#f8fafc'}
              onMouseOut={e => e.currentTarget.style.background = 'none'}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1, padding: '12px', borderRadius: '14px',
                border: 'none',
                background: danger
                  ? 'linear-gradient(135deg,#ef4444,#dc2626)'
                  : 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                color: 'white', fontWeight: 700, fontSize: '0.9rem',
                cursor: 'pointer', transition: 'all 0.2s'
              }}
              onMouseOver={e => e.currentTarget.style.opacity = '0.9'}
              onMouseOut={e => e.currentTarget.style.opacity = '1'}
            >
              {confirmText}
            </button>
          </div>
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export default ConfirmModal;
