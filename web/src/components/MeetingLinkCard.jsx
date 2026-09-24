import React from 'react';
import { Video, Copy, ExternalLink, Key, Clock, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

/**
 * MeetingLinkCard — displays meeting link info for a confirmed booking
 *
 * Props:
 *   booking  {object}  booking with meetingLink, meetingPlatform, meetingPassword, date, startTime
 *   compact  {boolean} if true, renders as a small inline card
 */
const MeetingLinkCard = ({ booking, compact = false }) => {
  if (!booking?.meetingLink) return null;

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${label} copied!`);
    }).catch(() => {
      toast.error('Could not copy — please copy manually');
    });
  };

  const platform = booking.meetingPlatform || 'Meeting';
  const platformColor = platform.toLowerCase().includes('zoom') ? '#2D8CFF' : '#00897B';
  const platformBg = platform.toLowerCase().includes('zoom') ? 'rgba(45,140,255,0.08)' : 'rgba(0,137,123,0.08)';

  const sessionDate = booking.date ? new Date(booking.date).toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long'
  }) : '';

  if (compact) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '10px 14px', background: platformBg,
        borderRadius: '12px', border: `1px solid ${platformColor}30`
      }}>
        <Video size={16} color={platformColor} />
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: platformColor }}>
          {platform} Link Ready
        </span>
        <a
          href={booking.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            marginLeft: 'auto', padding: '4px 10px', borderRadius: '8px',
            background: platformColor, color: 'white',
            fontSize: '0.75rem', fontWeight: 700, textDecoration: 'none',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}
        >
          Join <ExternalLink size={11} />
        </a>
      </div>
    );
  }

  return (
    <div style={{
      borderRadius: '20px',
      border: `2px solid ${platformColor}25`,
      background: platformBg,
      padding: '24px',
      marginTop: '16px'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{
          width: '44px', height: '44px', borderRadius: '12px',
          background: platformColor, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Video size={22} color="white" />
        </div>
        <div>
          <p style={{ margin: 0, fontWeight: 800, fontSize: '1rem', color: '#0f172a' }}>
            {platform} Session Ready
          </p>
          <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: '#64748b' }}>
            Your virtual meeting room is set up
          </p>
        </div>
      </div>

      {/* Session info */}
      {sessionDate && (
        <div style={{ display: 'flex', gap: '16px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
            <Calendar size={14} color={platformColor} />
            {sessionDate}
          </div>
          {booking.startTime && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>
              <Clock size={14} color={platformColor} />
              {booking.startTime}{booking.endTime ? ` – ${booking.endTime}` : ''}
            </div>
          )}
        </div>
      )}

      {/* Meeting link */}
      <div style={{ marginBottom: '12px' }}>
        <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
          Meeting Link
        </label>
        <div style={{ display: 'flex', gap: '8px' }}>
          <div style={{
            flex: 1, padding: '10px 14px', background: 'white',
            borderRadius: '12px', border: '1px solid #e2e8f0',
            fontSize: '0.82rem', color: '#0f172a', fontWeight: 600,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {booking.meetingLink}
          </div>
          <button
            onClick={() => copyToClipboard(booking.meetingLink, 'Meeting link')}
            title="Copy link"
            style={{
              padding: '10px 14px', background: 'white', border: '1px solid #e2e8f0',
              borderRadius: '12px', cursor: 'pointer', color: '#64748b',
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '0.75rem', fontWeight: 700, transition: 'all 0.2s',
              flexShrink: 0
            }}
            onMouseOver={e => { e.currentTarget.style.background = platformBg; e.currentTarget.style.color = platformColor; }}
            onMouseOut={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#64748b'; }}
          >
            <Copy size={14} /> Copy
          </button>
        </div>
      </div>

      {/* Password if exists (Zoom) */}
      {booking.meetingPassword && (
        <div style={{ marginBottom: '12px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '8px' }}>
            Meeting Password
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            <div style={{
              flex: 1, padding: '10px 14px', background: 'white',
              borderRadius: '12px', border: '1px solid #e2e8f0',
              fontSize: '0.82rem', fontWeight: 800, letterSpacing: '0.15em', color: '#0f172a',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <Key size={14} color={platformColor} />
              {booking.meetingPassword}
            </div>
            <button
              onClick={() => copyToClipboard(booking.meetingPassword, 'Password')}
              title="Copy password"
              style={{
                padding: '10px 14px', background: 'white', border: '1px solid #e2e8f0',
                borderRadius: '12px', cursor: 'pointer', color: '#64748b',
                display: 'flex', alignItems: 'center', gap: '4px',
                fontSize: '0.75rem', fontWeight: 700, flexShrink: 0
              }}
            >
              <Copy size={14} /> Copy
            </button>
          </div>
        </div>
      )}

      {/* Join button */}
      <a
        href={booking.meetingLink}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
          marginTop: '20px', padding: '14px',
          background: `linear-gradient(135deg, ${platformColor}, ${platformColor}cc)`,
          color: 'white', borderRadius: '14px', textDecoration: 'none',
          fontWeight: 800, fontSize: '0.95rem',
          boxShadow: `0 8px 24px ${platformColor}40`,
          transition: 'transform 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.transform = 'translateY(-2px)'}
        onMouseOut={e => e.currentTarget.style.transform = 'none'}
      >
        <Video size={18} />
        Join {platform} Now
        <ExternalLink size={15} />
      </a>

      <p style={{ textAlign: 'center', fontSize: '0.72rem', color: '#94a3b8', marginTop: '12px' }}>
        Link opens in a new tab · Make sure your camera & mic are ready
      </p>
    </div>
  );
};

export default MeetingLinkCard;
