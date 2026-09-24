import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { buildUrl, API_ENDPOINTS } from '../config/api';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post(buildUrl(API_ENDPOINTS.AUTH.FORGOT_PASSWORD), { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        {sent ? (
          <div className="success-state">
            <div className="success-icon">
              <CheckCircle size={48} color="#22c55e" />
            </div>
            <h2>Check Your Email</h2>
            <p>We've sent a password reset link to <strong>{email}</strong>. It expires in 10 minutes.</p>
            <p className="sub-note">Don't see it? Check your spam folder.</p>
            <Link to="/login" className="btn btn-primary" style={{ marginTop: '24px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <ArrowLeft size={16} /> Back to Login
            </Link>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <div className="lock-icon">🔐</div>
              <h1>Forgot Password?</h1>
              <p>No worries! Enter your email and we'll send you a reset link.</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label htmlFor="reset-email">Email Address</label>
                <div className="input-wrapper">
                  <Mail size={18} className="input-icon" />
                  <input
                    id="reset-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    required
                    className="form-input with-icon"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Send Reset Link'}
              </button>
            </form>

            <p className="auth-footer">
              Remember your password? <Link to="/login" className="link">Sign in</Link>
            </p>
          </>
        )}
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          background: var(--bg);
        }
        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 48px 40px;
          border-radius: 24px;
        }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .lock-icon { font-size: 48px; margin-bottom: 16px; }
        .auth-header h1 { font-size: 1.75rem; margin-bottom: 8px; }
        .auth-header p { color: var(--text-muted); font-size: 0.95rem; line-height: 1.6; }
        .error-banner {
          background: #fee2e2; color: #dc2626; border-radius: 10px;
          padding: 12px 16px; font-size: 0.9rem; font-weight: 600; margin-bottom: 20px;
        }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-weight: 600; font-size: 0.9rem; color: var(--text-main); }
        .input-wrapper { position: relative; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .form-input {
          width: 100%; padding: 12px 16px; border: 1.5px solid var(--glass-border);
          border-radius: 12px; font-size: 0.95rem; background: white; outline: none;
          transition: border-color 0.2s; box-sizing: border-box;
        }
        .form-input.with-icon { padding-left: 44px; }
        .form-input:focus { border-color: var(--primary); }
        .btn-full { width: 100%; justify-content: center; }
        .auth-footer { text-align: center; font-size: 0.9rem; color: var(--text-muted); margin-top: 20px; }
        .link { color: var(--primary); font-weight: 600; text-decoration: none; }
        .link:hover { text-decoration: underline; }
        .spinner {
          width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite;
          display: inline-block;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        .success-state { text-align: center; padding: 16px 0; }
        .success-icon { margin-bottom: 20px; }
        .success-state h2 { font-size: 1.5rem; margin-bottom: 12px; }
        .success-state p { color: var(--text-muted); line-height: 1.6; }
        .sub-note { font-size: 0.85rem; margin-top: 8px; }
      `}</style>
    </div>
  );
};

export default ForgotPasswordPage;
