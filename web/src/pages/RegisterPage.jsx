import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Briefcase, ArrowRight, Eye, EyeOff, Shield, Building2 } from 'lucide-react';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'user',
    category: 'Healthcare & Hospitals', // Professional default
    companyName: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Normalize input for a smooth experience
    const cleanEmail = formData.email.trim().toLowerCase();
    const cleanName = formData.name.trim();

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return setError('Please enter a valid email address');
    }

    if (formData.password.length < 6) {
      return setError('Password must be at least 6 characters');
    }

    try {
      const user = await register({
        ...formData,
        name: cleanName,
        email: cleanEmail
      });
      if (user.role === 'expert') {
        navigate('/hub/dashboard');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Registration Error:', err);
      if (!err.response) {
        setError('Connection Timeout or Network Error. Please ensure the backend is running and you are not using an aggressive ad-blocker.');
      } else if (err.response.status === 409) {
        setError('This email address is already registered. Please login instead.');
      } else {
        setError(err.response.data.message || 'Registration failed - check fields');
      }
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
          <h2>Create Account</h2>
          <p>Join the expert network today</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="role-wrapper">
            <label>I am a... <span className="req">*</span></label>
            <div className="role-selector">
              <button 
                type="button" 
                className={`role-btn ${formData.role === 'user' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, role: 'user'})}
              >
                <User size={20} /> Consumer
              </button>
              <button 
                type="button" 
                className={`role-btn ${formData.role === 'expert' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, role: 'expert'})}
              >
                <Briefcase size={20} /> Expert
              </button>
              <button 
                type="button" 
                className={`role-btn ${formData.role === 'company_owner' ? 'active' : ''}`}
                onClick={() => setFormData({...formData, role: 'company_owner'})}
              >
                <Building2 size={20} /> Company
              </button>
            </div>
          </div>

          <div className="field-wrapper">
            <label>Full Name <span className="req">*</span></label>
            <div className="input-group">
              <User size={18} />
              <input 
                type="text" 
                placeholder="John Doe" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
          </div>

          {formData.role === 'expert' && (
            <div className="field-wrapper">
              <label>Service Category <span className="req">*</span></label>
              <div className="input-group">
                <Briefcase size={18} />
                <select 
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  required
                  style={{ width: '100%', border: 'none', background: 'transparent', padding: '14px 12px', outline: 'none', cursor: 'pointer' }}
                >
                  <option value="Healthcare & Hospitals">Healthcare & Hospitals</option>
                  <option value="Corporate & Brands">Corporate & Brands</option>
                  <option value="Education & Schools">Education & Schools</option>
                  <option value="Cinemas & Entertainment">Cinemas & Entertainment</option>
                  <option value="Legal & Advisory">Legal & Advisory</option>
                  <option value="IT & Tech Support">IT & Tech Support</option>
                  <option value="Hospitality & Tourism">Hospitality & Tourism</option>
                  <option value="Business & Finance">Business & Finance</option>
                </select>
              </div>
            </div>
          )}

          {formData.role === 'expert' && (
            <div className="field-wrapper">
              <label>Organization Name (Optional)</label>
              <div className="input-group">
                <Briefcase size={18} />
                <input 
                  type="text" 
                  placeholder="e.g. City Hospital or Brand Name" 
                  value={formData.companyName}
                  onChange={(e) => setFormData({...formData, companyName: e.target.value})}
                />
              </div>
              <p className="field-hint">Leave blank if you are an individual provider</p>
            </div>
          )}

          <div className="field-wrapper">
            <label>Email Address <span className="req">*</span></label>
            <div className="input-group">
              <Mail size={18} />
              <input 
                type="email" 
                placeholder="john@example.com" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>
          </div>

          <div className="field-wrapper">
            <label>Create Password <span className="req">*</span></label>
            <div className="input-group">
              <Lock size={18} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="••••••••" 
                value={formData.password}
                onChange={(e) => setFormData({...formData, password: e.target.value})}
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

          <button type="submit" className="btn btn-primary w-full">
            Get Started <ArrowRight size={18} />
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </motion.div>

      <style jsx>{`
        .auth-page {
          min-height: calc(100vh - 100px);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
        }

        .auth-card {
          width: 100%;
          max-width: 480px;
          padding: 48px;
          border-radius: 24px;
        }

        .role-selector {
          display: grid;
          grid-template-columns: 1fr 1fr 1fr;
          gap: 12px;
          margin-bottom: 24px;
        }

        .role-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 16px;
          border: 2px solid var(--glass-border);
          border-radius: 12px;
          background: transparent;
          cursor: pointer;
          font-family: inherit;
          font-weight: 600;
          color: var(--text-muted);
          transition: all 0.2s;
        }

        .role-btn.active {
          border-color: var(--primary);
          color: var(--primary);
          background: rgba(99, 102, 241, 0.05);
        }

        .auth-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .auth-header h2 {
          font-size: 2rem;
          margin-bottom: 8px;
        }

        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .field-wrapper, .role-wrapper {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .field-wrapper label, .role-wrapper label {
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
        }

        .w-full {
          width: 100%;
          justify-content: center;
          margin-top: 10px;
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
        .field-hint {
          font-size: 0.75rem;
          color: var(--text-muted);
          padding-left: 4px;
          margin-top: -4px;
        }
      `}</style>
    </div>
  );
};

export default RegisterPage;
