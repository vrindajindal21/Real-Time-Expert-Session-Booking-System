import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { buildUrl, API_ENDPOINTS } from '../config/api';
import {
  Calendar, Shield, Zap, Users, ArrowRight, CheckCircle,
  Lock, BarChart2, MessageSquare, Clock, Globe
} from 'lucide-react';

const INDUSTRIES = [
  { emoji: '🩺', label: 'Hospitals & Health', cat: 'Healthcare & Hospitals' },
  { emoji: '🏪', label: 'Corporate Brands', cat: 'Corporate & Brands' },
  { emoji: '🍿', label: 'Cinemas & Media', cat: 'Cinemas & Entertainment' },
  { emoji: '📚', label: 'Education & EdTech', cat: 'Education & Schools' },
  { emoji: '💼', label: 'Firms & Advisory', cat: 'Legal & Advisory' },
  { emoji: '🏨', label: 'Hotels & Tourism', cat: 'Hospitality & Tourism' },
  { emoji: '💰', label: 'Banking & Finance', cat: 'Business & Finance' },
  { emoji: '💻', label: 'Tech & IT Support', cat: 'IT & Tech Support' },
];

const LandingPage = () => {
  const [stats, setStats] = useState({
    activeSessions: 120,
    totalImpact: 15000,
    expertCommunity: 50,
    satisfiedUsers: 1200
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get(buildUrl(API_ENDPOINTS.PUBLIC.GLOBAL_STATS));
        if (res.data.success) {
          setStats(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching global stats:', err);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="landing-root">

      {/* ── HERO ────────────────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-blur-1" />
        <div className="hero-blur-2" />

        <motion.div
          className="hero-content"
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        >
          <div className="status-badge glass">
            <span className="ticker-dot" />
            Trusted by Gyms · Hospitals · Law Firms · Brands · Coaches
          </div>

          <h1 className="hero-heading">
            One Platform.<br />
            <span className="gradient-text">Every Business.</span><br />
            Zero Missed Bookings.
          </h1>

          <p className="hero-sub">
            From hospital clinics to gym trainers, law firms to beauty salons —
            manage expert sessions, staff, payments & real-time communication in one place.
            Built to scale from 1 expert to 10,000.
          </p>

          <div className="hero-ctas">
            <Link to="/register" className="btn btn-cta-primary">
              Start Free Today <ArrowRight size={20} />
            </Link>
            <Link to="/search" className="btn btn-cta-outline">
              See It Live
            </Link>
          </div>


          <div className="trust-badges">
            <span className="trust-badge"><Shield size={14} /> Secure Authentication</span>
            <span className="trust-badge"><Clock size={14} /> Real-Time Locking</span>
            <span className="trust-badge"><MessageSquare size={14} /> Integrated Chat</span>
          </div>
        </motion.div>

        {/* Technical Preview Card */}
        <motion.div
          className="dashboard-preview glass"
          initial={{ opacity: 0, x: 60 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <div className="dp-header">
            <div className="dp-dot red" /><div className="dp-dot yellow" /><div className="dp-dot green" />
            <span className="dp-title">Platform Technical Preview</span>
          </div>
          <div className="dp-tech-list">
            <div className="tech-item"><Zap size={16} /> <span>MERN Stack Architecture</span></div>
            <div className="tech-item"><Globe size={16} /> <span>Socket.io Implementation</span></div>
            <div className="tech-item"><Lock size={16} /> <span>JWT Security Layer</span></div>
            <div className="tech-item"><BarChart2 size={16} /> <span>Atomic Slot Management</span></div>
          </div>
          <div className="dp-notification glass">
            <CheckCircle size={16} color="#22c55e" />
            <span>Infrastructure Online — Ready for Testing</span>
          </div>
        </motion.div>
      </section>

      {/* ── GLOBAL PULSE STATS ────────────────────────────────────────── */}
      <section className="pulse-stats-section">
        <div className="pulse-grid">
          <motion.div className="pulse-card glass" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="pulse-value">{stats.activeSessions.toLocaleString()}+</div>
            <div className="pulse-label">Live Active Sessions</div>
            <div className="pulse-trend">Real-Time Concurrent Tracking</div>
          </motion.div>
          <motion.div className="pulse-card glass" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}>
            <div className="pulse-value">${stats.totalImpact.toLocaleString()}+</div>
            <div className="pulse-label">Global Impact Value</div>
            <div className="pulse-trend">Economical Value Processed</div>
          </motion.div>
          <motion.div className="pulse-card glass" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2 }}>
            <div className="pulse-value">{stats.expertCommunity.toLocaleString()}+</div>
            <div className="pulse-label">Expert Community</div>
            <div className="pulse-trend">Across 12 Global Industries</div>
          </motion.div>
          <motion.div className="pulse-card glass" initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3 }}>
            <div className="pulse-value">{stats.satisfiedUsers.toLocaleString()}+</div>
            <div className="pulse-label">Satisfied Members</div>
            <div className="pulse-trend">Verified Booking Reviews</div>
          </motion.div>
        </div>
      </section>

      {/* ── INDUSTRIES ──────────────────────────────────────────────── */}
      <section className="industries-section">
        <div className="section-label-pill">Works For Everyone</div>
        <h2 className="section-heading">Built for <span className="gradient-text">Every Industry</span></h2>
        <p className="section-sub">One platform, unlimited verticals. If your business runs on appointments, sessions, or consultations — this is built for you.</p>
        <div className="industries-grid">
          {[
            { emoji: '🏥', label: 'Hospitals & Clinics', desc: 'Doctor appointments, specialist consultations' },
            { emoji: '🏋️', label: 'Gyms & Fitness', desc: 'Personal trainers, classes, wellness coaches' },
            { emoji: '⚖️', label: 'Law Firms', desc: 'Client consultations, case reviews' },
            { emoji: '🏦', label: 'Banking & Finance', desc: 'Financial advisors, wealth managers' },
            { emoji: '🎓', label: 'Education & Coaching', desc: 'Tutors, EdTech, career mentors' },
            { emoji: '💅', label: 'Beauty & Salons', desc: 'Stylists, spas, aesthetic clinics' },
            { emoji: '🏢', label: 'Corporate Brands', desc: 'B2B consulting, enterprise training' },
            { emoji: '💻', label: 'Tech & IT Support', desc: 'Developers, SaaS demos, support' },
            { emoji: '🏨', label: 'Hotels & Tourism', desc: 'Concierge, guided tours, experiences' },
            { emoji: '🎬', label: 'Media & Creators', desc: 'Agencies, content studios, production' },
            { emoji: '🏗️', label: 'Architecture & Design', desc: 'Architects, interior designers, contractors' },
            { emoji: '🐾', label: 'Pet Care & Veterinary', desc: 'Vets, groomers, animal trainers' },
          ].map((ind, i) => (
            <motion.div
              key={i} whileHover={{ y: -6, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Link to={`/search?category=${encodeURIComponent(ind.label)}`} className="industry-card glass">
                <span className="ind-emoji">{ind.emoji}</span>
                <span className="ind-label">{ind.label}</span>
                <span className="ind-desc">{ind.desc}</span>
                <ArrowRight size={14} className="ind-arrow" />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ────────────────────────────────────────────────── */}
      <section className="features-section">
        <div className="section-label-pill">Core Features</div>
        <h2 className="section-heading">Engineered for Reliability</h2>
        <p className="section-sub">We focus on the technical details that make booking seamless.</p>

        <div className="features-grid-big">
          <motion.div
            className="feature-big glass"
            whileInView={{ opacity: 1, x: 0 }}
            initial={{ opacity: 0, x: -40 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="fb-icon"><Zap size={28} color="#6366f1" /></div>
            <h3>Atomic Scheduling</h3>
            <p>Our slot management engine ensures a slot is locked the moment a user initiates booking,
              eliminating the possibility of double-booking across all industries.</p>
            <div className="feature-tags">
              <span>Concurrent Safety</span><span>MongoDB Transactions</span>
            </div>
          </motion.div>

          <div className="features-col">
            {[
              { icon: <Shield size={22} color="#ec4899" />, title: 'Multi-Role Access', desc: 'Secure portals for Admins, Service Providers, and Customers.' },
              { icon: <MessageSquare size={22} color="#8b5cf6" />, title: 'Real-Time Communication', desc: 'Embedded chat for instant pre-session clearing of doubts.' },
              { icon: <BarChart2 size={22} color="#22c55e" />, title: 'Data Visualization', desc: 'Clean dashboards to help providers monitor their session growth.' },
              { icon: <Clock size={22} color="#f59e0b" />, title: 'Dynamic Slots', desc: 'Flexible scheduling tools for experts to manage their availability.' },
            ].map((f, i) => (
              <motion.div
                key={i} className="feature-sm glass"
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="fsm-icon">{f.icon}</div>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────────────── */}
      <section style={{ maxWidth: '1280px', margin: '0 auto', padding: '80px 40px', textAlign: 'center' }}>
        <div className="section-label-pill">Simple Setup</div>
        <h2 className="section-heading">Up & Running in <span className="gradient-text">Under 10 Minutes</span></h2>
        <p className="section-sub">No technical skills needed. Sign up, set your services, go live.</p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px', marginTop: '48px', textAlign: 'left' }}>
          {[
            { step: '01', icon: '🏢', title: 'Create your business profile', desc: 'Add your company, logo, services offered and working hours. Takes 5 minutes.' },
            { step: '02', icon: '👥', title: 'Add your team', desc: 'Invite staff members. Assign them to services. They each get their own dashboard.' },
            { step: '03', icon: '📅', title: 'Set your schedule', desc: 'Define available slots, block off holidays, set session durations and prices.' },
            { step: '04', icon: '🚀', title: 'Share your booking link', desc: 'Clients book online. You get notified instantly. Payments processed automatically.' },
          ].map((s, i) => (
            <motion.div
              key={i} className="glass"
              initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              style={{ padding: '32px', borderRadius: '20px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <span style={{ fontSize: '1.6rem' }}>{s.icon}</span>
                <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--primary)', letterSpacing: '0.08em', background: 'rgba(99,102,241,0.08)', padding: '3px 10px', borderRadius: '100px' }}>
                  STEP {s.step}
                </span>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, marginBottom: '10px' }}>{s.title}</h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, margin: 0 }}>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FINAL CTA ─────────────────────────────────────────────── */}
      <section className="vision-section glass" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.06))' }}>
        <h2 className="section-heading">Ready to Grow Your Business?</h2>
        <p className="section-sub" style={{ maxWidth: '560px', margin: '0 auto 32px' }}>
          Join gyms, hospitals, law firms, coaches, and hundreds of other businesses
          already managing their expert sessions here. Free to start — scales as you grow.
        </p>
        <div style={{ display: 'flex', gap: '14px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/register?type=company" className="btn btn-cta-primary">
            Register My Business <ArrowRight size={20} />
          </Link>
          <Link to="/register?type=individual" className="btn btn-cta-outline">
            I'm an Individual Expert
          </Link>
        </div>
        <p style={{ marginTop: '20px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          No credit card required · Free plan available · Cancel anytime
        </p>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────── */}
      <footer className="landing-footer">
        <div className="footer-brand">
          <span className="footer-logo">✦ ExpertBooking</span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>For every business, everywhere</span>
        </div>
        <div className="footer-links">
          <Link to="/search">Browse Experts</Link>
          <Link to="/register">Get Started</Link>
          <Link to="/login">Sign In</Link>
        </div>
        <p className="footer-copy">© 2026 ExpertBooking Platform.</p>
      </footer>

      <style>{`
        /* ── Root ── */
        .landing-root { overflow-x: hidden; }

        /* ── Hero ── */
        .hero {
          min-height: 80vh;
          display: grid;
          grid-template-columns: 1.1fr 0.9fr;
          gap: 60px;
          align-items: center;
          max-width: 1280px;
          margin: 0 auto;
          padding: 80px 40px;
          position: relative;
        }
        .hero-blur-1 {
          position: fixed; top: -200px; left: -200px;
          width: 700px; height: 700px;
          background: radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%);
          border-radius: 50%; z-index: -1; pointer-events: none;
        }
        .hero-blur-2 {
          position: fixed; bottom: -200px; right: -200px;
          width: 600px; height: 600px;
          background: radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%);
          border-radius: 50%; z-index: -1; pointer-events: none;
        }

        .status-badge {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 8px 20px; border-radius: 100px;
          font-size: 0.82rem; font-weight: 700; color: var(--text-muted);
          margin-bottom: 24px;
        }
        .ticker-dot { width: 8px; height: 8px; background: #6366f1; border-radius: 50%; flex-shrink: 0; animation: pulse 2s infinite; }

        .hero-heading {
          font-size: clamp(2.4rem, 5vw, 3.8rem);
          line-height: 1.1;
          letter-spacing: -0.02em;
          margin-bottom: 20px;
          font-weight: 800;
        }
        .hero-sub {
          font-size: 1.1rem; color: var(--text-muted); line-height: 1.7;
          max-width: 520px; margin-bottom: 36px;
        }
        .hero-ctas { display: flex; gap: 14px; margin-bottom: 28px; flex-wrap: wrap; }

        .btn-cta-primary {
          display: inline-flex; align-items: center; gap: 8px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: white; font-weight: 700; font-size: 1rem;
          padding: 14px 28px; border-radius: 14px; transition: all 0.25s;
        }
        .btn-cta-primary:hover { transform: translateY(-1px); }
        .btn-cta-outline {
          display: inline-flex; align-items: center; gap: 8px;
          background: transparent; border: 2px solid var(--glass-border);
          color: var(--text-main); font-weight: 700; font-size: 1rem;
          padding: 14px 28px; border-radius: 14px; transition: all 0.25s;
        }

        .trust-badges { display: flex; gap: 12px; flex-wrap: wrap; }
        .trust-badge {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 0.75rem; font-weight: 700; color: var(--text-muted);
          background: rgba(0,0,0,0.03); padding: 5px 12px; border-radius: 8px;
        }

        /* Dashboard Preview */
        .dashboard-preview {
          border-radius: 20px; padding: 24px;
          box-shadow: 0 10px 40px rgba(0,0,0,0.08);
        }
        .dp-header {
          display: flex; align-items: center; gap: 8px;
          margin-bottom: 20px; padding-bottom: 12px;
          border-bottom: 1px solid var(--glass-border);
        }
        .dp-dot { width: 10px; height: 10px; border-radius: 50%; }
        .dp-dot.red { background: #ef4444; }
        .dp-dot.yellow { background: #f59e0b; }
        .dp-dot.green { background: #22c55e; }
        .dp-title { font-size: 0.8rem; font-weight: 700; color: var(--text-muted); }
        .dp-tech-list { display: flex; flex-direction: column; gap: 12px; margin-bottom: 20px; }
        .tech-item { display: flex; align-items: center; gap: 12px; font-size: 0.9rem; color: var(--text-main); font-weight: 600; }
        .tech-item span { color: var(--text-muted); font-size: 0.8rem; }
        
        .dp-notification {
          display: flex; align-items: center; gap: 10px;
          padding: 10px 14px; border-radius: 10px;
          font-size: 0.8rem; font-weight: 700; color: var(--text-main);
        }

        /* Pulse Stats */
        .pulse-stats-section {
          max-width: 1280px; margin: -40px auto 60px auto;
          padding: 0 40px; position: relative; z-index: 10;
        }
        .pulse-grid {
          display: grid; grid-template-columns: repeat(4, 1fr); gap: 24px;
        }
        .pulse-card {
          padding: 32px 24px; border-radius: 24px; text-align: center;
          transition: all 0.3s; background: rgba(255, 255, 255, 0.4);
        }
        .pulse-card:hover { transform: translateY(-8px); background: white; box-shadow: 0 20px 40px rgba(0,0,0,0.06); }
        .pulse-value { font-size: 2rem; font-weight: 900; color: var(--primary); margin-bottom: 8px; letter-spacing: -1px; }
        .pulse-label { font-size: 0.9rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; }
        .pulse-trend { font-size: 0.72rem; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

        /* Industries */
        .industries-section {
          max-width: 1280px; margin: 0 auto;
          padding: 60px 40px; text-align: center;
        }
        .section-label-pill {
          display: inline-block;
          background: rgba(99,102,241,0.08); color: var(--primary);
          padding: 6px 16px; border-radius: 100px;
          font-size: 0.8rem; font-weight: 800;
          text-transform: uppercase; margin-bottom: 16px;
        }
        .section-heading { font-size: 2.2rem; font-weight: 800; margin-bottom: 8px; }
        .section-sub { color: var(--text-muted); font-size: 1rem; margin-bottom: 40px; max-width: 600px; margin-left: auto; margin-right: auto; }
        .industries-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 16px;
        }
        .industry-card {
          display: flex; flex-direction: column; align-items: center;
          gap: 8px; padding: 24px 16px; border-radius: 16px; text-decoration: none;
          font-weight: 700; color: var(--text-main); transition: all 0.2s; text-align: center;
        }
        .ind-emoji { font-size: 1.8rem; }
        .ind-label { font-size: 0.9rem; font-weight: 800; }
        .ind-desc { font-size: 0.75rem; color: var(--text-muted); font-weight: 500; line-height: 1.4; }
        .ind-arrow { opacity: 0; transition: opacity 0.2s; }
        .industry-card:hover .ind-arrow { opacity: 1; color: var(--primary); }

        /* Features */
        .features-section {
          max-width: 1280px; margin: 0 auto;
          padding: 60px 40px; text-align: center;
        }
        .features-grid-big {
          display: grid; grid-template-columns: 1fr 1fr; gap: 24px;
          text-align: left;
        }
        .feature-big {
          padding: 36px; border-radius: 20px; display: flex;
          flex-direction: column; gap: 16px;
        }
        .fb-icon {
          width: 48px; height: 48px;
          background: rgba(99,102,241,0.06); border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
        }
        .feature-big h3 { font-size: 1.4rem; font-weight: 800; }
        .feature-big p { color: var(--text-muted); line-height: 1.6; font-size: 0.9rem; }
        .feature-tags { display: flex; gap: 8px; }
        .feature-tags span {
          background: rgba(0,0,0,0.04); padding: 4px 10px; border-radius: 6px; font-size: 0.75rem; font-weight: 700;
        }
        .features-col { display: flex; flex-direction: column; gap: 16px; }
        .feature-sm {
          display: flex; align-items: center; gap: 16px;
          padding: 20px 24px; border-radius: 16px;
        }
        .fsm-icon {
          width: 40px; height: 40px; flex-shrink: 0;
          background: rgba(0,0,0,0.03); border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .feature-sm h4 { font-size: 0.95rem; font-weight: 700; }
        .feature-sm p { font-size: 0.85rem; color: var(--text-muted); }

        /* Vision */
        .vision-section {
          max-width: 1200px; margin: 60px auto;
          padding: 60px; border-radius: 24px; text-align: center;
        }

        /* Footer */
        .landing-footer {
          padding: 40px; display: flex; justify-content: space-between; align-items: center;
          border-top: 1px solid var(--glass-border);
        }
        .footer-logo { font-size: 1.1rem; font-weight: 800; color: var(--primary); }
        .footer-links { display: flex; gap: 24px; }
        .footer-links a { font-size: 0.9rem; color: var(--text-muted); font-weight: 700; }

        @keyframes pulse { 0% { opacity: 0.4; } 50% { opacity: 1; } 100% { opacity: 0.4; } }

        @media (max-width: 1024px) {
          .hero { grid-template-columns: 1fr; padding: 60px 24px; }
          .dashboard-preview { display: none; }
          .industries-grid { grid-template-columns: repeat(2, 1fr); }
          .features-grid-big { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
