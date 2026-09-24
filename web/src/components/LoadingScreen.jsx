import React from 'react';

const LoadingScreen = ({ message = 'Loading...' }) => (
  <div style={{
    position: 'fixed', inset: 0,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    background: 'var(--bg, #f8fafc)', zIndex: 9999, gap: '20px'
  }}>
    {/* Animated ring spinner */}
    <div style={{ position: 'relative', width: '56px', height: '56px' }}>
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        border: '4px solid rgba(99,102,241,0.15)',
        borderTopColor: '#6366f1',
        animation: 'spin 0.8s linear infinite'
      }} />
    </div>
    <p style={{
      fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-muted, #64748b)',
      letterSpacing: '0.03em'
    }}>
      {message}
    </p>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
  </div>
);

export default LoadingScreen;
