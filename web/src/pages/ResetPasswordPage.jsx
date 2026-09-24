import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { buildUrl, API_ENDPOINTS } from '../config/api';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password !== confirm) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      await axios.post(`${buildUrl(API_ENDPOINTS.AUTH.RESET_PASSWORD)}/${token}`, { password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 2500);
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card glass">
        {success ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <CheckCircle size={52} color="#22c55e" />
            <h2 style={{ margin: '16px 0 8px' }}>Password Reset!</h2>
            <p style={{ color: 'var(--text-muted)' }}>Redirecting you to login...</p>
          </div>
        ) : (
          <>
            <div className="auth-header">
              <div className="lock-icon">🔑</div>
              <h1>Set New Password</h1>
              <p>Choose a strong password for your account.</p>
            </div>

            {error && <div className="error-banner">{error}</div>}

            <form onSubmit={handleSubmit} className="auth-form">
              <div className="form-group">
                <label>New Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    required
                    className="form-input with-icon"
                  />
                  <button type="button" className="eye-btn" onClick={() => setShowPass(!showPass)}>
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>Confirm Password</label>
                <div className="input-wrapper">
                  <Lock size={18} className="input-icon" />
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat your password"
                    required
                    className="form-input with-icon"
                  />
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full" disabled={loading}>
                {loading ? <span className="spinner" /> : 'Reset Password'}
              </button>
            </form>

            <p className="auth-footer">
              <Link to="/login" className="link">← Back to Login</Link>
            </p>
          </>
        )}
      </div>

      <style>{`
        .auth-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; padding: 20px; background: var(--bg); }
        .auth-card { width: 100%; max-width: 440px; padding: 48px 40px; border-radius: 24px; }
        .auth-header { text-align: center; margin-bottom: 32px; }
        .lock-icon { font-size: 48px; margin-bottom: 16px; }
        .auth-header h1 { font-size: 1.75rem; margin-bottom: 8px; }
        .auth-header p { color: var(--text-muted); font-size: 0.95rem; }
        .error-banner { background: #fee2e2; color: #dc2626; border-radius: 10px; padding: 12px 16px; font-size: 0.9rem; font-weight: 600; margin-bottom: 20px; }
        .auth-form { display: flex; flex-direction: column; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 6px; }
        .form-group label { font-weight: 600; font-size: 0.9rem; }
        .input-wrapper { position: relative; }
        .input-icon { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--text-muted); }
        .eye-btn { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; cursor: pointer; color: var(--text-muted); }
        .form-input { width: 100%; padding: 12px 16px; border: 1.5px solid var(--glass-border); border-radius: 12px; font-size: 0.95rem; background: white; outline: none; transition: border-color 0.2s; box-sizing: border-box; }
        .form-input.with-icon { padding-left: 44px; padding-right: 44px; }
        .form-input:focus { border-color: var(--primary); }
        .btn-full { width: 100%; justify-content: center; }
        .auth-footer { text-align: center; font-size: 0.9rem; color: var(--text-muted); margin-top: 20px; }
        .link { color: var(--primary); font-weight: 600; text-decoration: none; }
        .spinner { width: 18px; height: 18px; border: 2px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; animation: spin 0.7s linear infinite; display: inline-block; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default ResetPasswordPage;
