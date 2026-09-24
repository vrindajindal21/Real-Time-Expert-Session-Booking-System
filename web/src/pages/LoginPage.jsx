import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Eye, EyeOff } from 'lucide-react';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Normalize input for a smooth login
    const normalizedEmail = email.trim().toLowerCase();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return setError('Please enter a valid email address');
    }

    try {
      const user = await login(normalizedEmail, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else if (user.role === 'expert') {
        navigate('/hub/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || 'Invalid email or password';
      setError(msg);
    }
  };

  return (
    <div className="auth-page">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="auth-card glass"
      >
        <div className="auth-header">
          <h2>Welcome Back</h2>
          <p>Login to manage your sessions</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="field-wrapper">
            <label>Email Address <span className="req">*</span></label>
            <div className="input-group">
              <Mail size={18} />
              <input 
                type="email" 
                placeholder="expert@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="field-wrapper">
            <label>Password <span className="req">*</span></label>
            <div className="input-group">
              <Lock size={18} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="eye-btn" 
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="flex justify-end" style={{ marginTop: '-12px' }}>
            <Link to="/forgot-password" style={{ fontSize: '0.85rem', color: 'var(--primary)', fontWeight: '600' }}>
              Forgot password?
            </Link>
          </div>

          <button type="submit" className="btn btn-primary w-full">
            Sign In <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/register">Register now</Link>
        </p>
      </motion.div>

      <style jsx>{`
        .auth-page {
          height: calc(100vh - 100px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .auth-card {
          width: 100%;
          max-width: 440px;
          padding: 48px;
          border-radius: 24px;
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-header h2 {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .auth-header p {
          color: var(--text-muted);
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .field-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-wrapper label {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-main);
          padding-left: 4px;
        }

        .req { color: #ef4444; }

        .input-group {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.5);
          border: 2px solid var(--glass-border);
          border-radius: 12px;
          padding: 0 16px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .input-group:focus-within {
          border-color: var(--primary);
          background: white;
          box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.1);
          transform: translateY(-1px);
        }

        .input-group input {
          width: 100%;
          padding: 14px 12px;
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: 1rem;
          outline: none;
        }

        .eye-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          cursor: pointer;
          display: flex;
          align-items: center;
          padding: 4px;
          transition: color 0.2s;
          margin-left: 4px;
        }

        .eye-btn:hover {
          color: var(--primary);
        }

        .error-msg {
          background: rgba(239, 68, 68, 0.1);
          color: var(--danger);
          padding: 12px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 24px;
          font-weight: 500;
          font-size: 0.9rem;
        }

        .w-full {
          width: 100%;
          justify-content: center;
        }

        .auth-footer {
          margin-top: 32px;
          text-align: center;
          color: var(--text-muted);
        }

        .auth-footer a {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
