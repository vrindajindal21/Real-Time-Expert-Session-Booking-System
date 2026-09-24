import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Search, Filter, Star, Clock, MapPin } from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { API_CONFIG } from '../config/api';
import { MOCK_CATEGORIES, MOCK_EXPERTS } from '../data/mockData';

const SearchProviders = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [experts, setExperts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const searchTerm = searchParams.get('search') || '';
  const category = searchParams.get('category') || 'all';
  const minExp = searchParams.get('minExp') || '0';

  const [inputValue, setInputValue] = useState(searchTerm);

  useEffect(() => {
    fetchCategories();
  }, []);

  // Sync local input state if the search term query param changes externally (e.g. initial load or browser back/forward)
  useEffect(() => {
    setInputValue(searchTerm);
  }, [searchTerm]);

  // Debounce input updates to URL search params to avoid API spam on keystrokes
  useEffect(() => {
    const handler = setTimeout(() => {
      if (inputValue !== (searchParams.get('search') || '')) {
        const newParams = new URLSearchParams(searchParams);
        if (inputValue) newParams.set('search', inputValue);
        else newParams.delete('search');
        setSearchParams(newParams);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [inputValue, searchParams, setSearchParams]);

  useEffect(() => {
    fetchExperts();
  }, [searchTerm, category, minExp]);

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get(`${API_CONFIG.baseUrl}/categories`);
      setCategories(data);
    } catch (err) {
      console.warn('Backend offline, using fallback categories');
      setCategories(MOCK_CATEGORIES);
    }
  };

  const fetchExperts = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API_CONFIG.baseUrl}/experts`, {
        params: { 
          search: searchTerm, 
          category: category === 'all' ? '' : category,
          minExperience: minExp
        }
      });
      setExperts(data.experts);
    } catch (err) {
      console.warn('Backend offline, using mock experts fallback');
      let filtered = [...MOCK_EXPERTS];
      if (category && category !== 'all') {
        filtered = filtered.filter(e => e.category.toLowerCase().includes(category.toLowerCase()));
      }
      if (searchTerm) {
        filtered = filtered.filter(e => 
          e.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          e.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (e.bio && e.bio.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      if (minExp && minExp !== '0') {
        filtered = filtered.filter(e => (e.experience || 0) >= parseInt(minExp, 10));
      }
      setExperts(filtered);
      setError(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setInputValue(e.target.value);
  };

  const handleCategoryChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value !== 'all') newParams.set('category', e.target.value);
    else newParams.delete('category');
    setSearchParams(newParams);
  };

  const handleExpChange = (e) => {
    const newParams = new URLSearchParams(searchParams);
    if (e.target.value !== '0') newParams.set('minExp', e.target.value);
    else newParams.delete('minExp');
    setSearchParams(newParams);
  };

  return (
    <div className="search-page">
      <header className="search-header">
        <h1>Find the Right <span className="gradient-text">Expert</span></h1>
        <p>Book a session with top-rated professionals in seconds</p>

        <div className="search-bar-container glass">
          <div className="search-input">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={inputValue}
              onChange={handleSearchChange}
            />
          </div>
          <select
            className="category-select"
            value={category}
            onChange={handleCategoryChange}
          >
            <option value="all">All Industries</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.name}>{cat.name}</option>
            ))}
          </select>
          <select
            className="category-select"
            value={minExp}
            onChange={handleExpChange}
          >
            <option value="0">Any Experience</option>
            <option value="2">2+ Years</option>
            <option value="5">5+ Years</option>
            <option value="10">10+ Years</option>
          </select>
        </div>
      </header>

      <main className="results-container">
        {error && <div className="error-alert glass">{error}</div>}
        {loading ? (
          <div className="loading-state">Finding experts...</div>
        ) : experts.length > 0 ? (
          <div className="experts-grid">
            {experts.map((expert) => (
              <motion.div
                key={expert._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="expert-card glass"
              >
                <div className="card-badge">{expert.category}</div>
                <div className="expert-info">
                  <h3>{expert.name}</h3>
                  <p className="bio">{(expert.bio || 'Expert profile coming soon...').substring(0, 100)}{(expert.bio || '').length > 100 ? '...' : ''}</p>

                  <div className="stats-row">
                    <span className="stat"><Star size={16} fill="#fbbf24" color="#fbbf24" /> {expert.rating} Rating</span>
                    <span className="stat exp-badge"><Clock size={16} /> {expert.experience || 0} Yrs Expertise</span>
                  </div>
                </div>

                <div className="card-footer">
                  <div className="price-tag">Starting from <span>₹{expert.services?.length > 0 ? Math.min(...expert.services.map(s => s.price)) : '0'}</span></div>
                  <Link to={`/hub/${expert._id}`} className="btn btn-primary btn-sm">View Profile</Link>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="empty-state">No experts found matching your criteria.</div>
        )}
      </main>

      <style jsx>{`
        .search-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 20px;
        }

        .search-header {
          text-align: center;
          margin-bottom: 60px;
        }

        .search-header h1 {
          font-size: 3rem;
          margin-bottom: 12px;
        }

        .search-header p {
          color: var(--text-muted);
          font-size: 1.1rem;
          margin-bottom: 32px;
        }

        .search-bar-container {
          display: flex;
          max-width: 800px;
          margin: 0 auto;
          padding: 8px;
          border-radius: 100px;
          gap: 12px;
        }

        .search-input {
          flex: 1;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 20px;
        }

        .search-input input {
          width: 100%;
          border: none;
          background: transparent;
          font-family: inherit;
          font-size: 1.1rem;
          outline: none;
        }

        .category-select {
          background: var(--bg);
          border: 1px solid var(--glass-border);
          padding: 12px 24px;
          border-radius: 100px;
          font-family: inherit;
          font-weight: 600;
          cursor: pointer;
        }

        .experts-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
          gap: 30px;
        }

        .expert-card {
          padding: 0;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .error-alert {
          background: #fee2e2;
          color: #dc2626;
          padding: 20px;
          border-radius: 12px;
          text-align: center;
          margin-bottom: 30px;
          font-weight: 600;
        }

        .card-badge {
          position: absolute;
          top: 16px;
          right: 16px;
          background: rgba(99, 102, 241, 0.1);
          color: var(--primary);
          padding: 4px 12px;
          border-radius: 100px;
          font-size: 0.8rem;
          font-weight: 600;
        }

        .expert-info {
          padding: 24px;
          flex: 1;
        }

        .doctor-info h3 {
          font-size: 1.5rem;
          margin-bottom: 12px;
        }

        .bio {
          color: var(--text-muted);
          font-size: 0.95rem;
          margin-bottom: 20px;
          line-height: 1.6;
        }

        .stats-row {
          display: flex;
          gap: 20px;
        }

        .stat {
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
          font-size: 0.9rem;
        }

        .exp-badge {
          background: rgba(99, 102, 241, 0.08); /* Faint primary tint */
          color: var(--primary);
          padding: 4px 10px;
          border-radius: 8px;
          border: 1px solid rgba(99, 102, 241, 0.2);
        }

        .card-footer {
          padding: 20px 24px;
          background: rgba(0,0,0,0.02);
          border-top: 1px solid var(--glass-border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .price-tag {
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .price-tag span {
          display: block;
          font-size: 1.25rem;
          font-weight: 700;
          color: var(--text-main);
        }

        .loading-state, .empty-state {
          text-align: center;
          padding: 100px 0;
          font-size: 1.25rem;
          color: var(--text-muted);
        }

        @media (max-width: 640px) {
          .search-bar-container {
            flex-direction: column;
            border-radius: 20px;
            padding: 20px;
          }
          .search-header h1 { font-size: 2rem; }
        }
      `}</style>
    </div>
  );
};

export default SearchProviders;
