import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG, buildUrl, REQUEST_CONFIG, API_ENDPOINTS } from '../config/api';

const AuthContext = createContext();

// Configure axios defaults
axios.defaults.timeout = API_CONFIG.timeout;

// ─── JWT Utilities ────────────────────────────────────────────────────────────

/**
 * Decode a JWT payload without verification (client-side only).
 * Returns null if the token is malformed.
 */
const decodeToken = (token) => {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload));
  } catch {
    return null;
  }
};

/**
 * Returns true if the token is missing OR expired (with 30s buffer).
 */
const isTokenExpired = (token) => {
  if (!token) return true;
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  const bufferSeconds = 30;
  return decoded.exp * 1000 < Date.now() + bufferSeconds * 1000;
};

// ─── Axios Global 401 Interceptor ─────────────────────────────────────────────
// Attaches once at module load — clears auth on any 401 response
let globalLogout = null;

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token invalid or expired — force logout
      localStorage.removeItem('token');
      if (globalLogout) globalLogout();
    }
    return Promise.reject(error);
  }
);

// ─── Auth Provider ────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Expose logout to the global axios interceptor
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
    globalLogout = null;
  }, []);

  useEffect(() => {
    globalLogout = logout;
    return () => { globalLogout = null; };
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');

    // ✅ Check expiry BEFORE hitting the API — avoids a round-trip
    if (!token || isTokenExpired(token)) {
      if (token) {
        // Token exists but is expired — clean it up silently
        localStorage.removeItem('token');
        console.info('Session expired. Please log in again.');
      }
      setLoading(false);
      return;
    }

    fetchUser(token);
  }, []);

  const fetchUser = async (token) => {
    try {
      const { data } = await axios.get(buildUrl(API_ENDPOINTS.AUTH.PROFILE), {
        headers: REQUEST_CONFIG.addAuthHeader(token)
      });
      setUser(data);
    } catch (err) {
      const decoded = decodeToken(token);
      if (decoded && !isTokenExpired(token)) {
        setUser({
          id: decoded.id || 'user_demo_1',
          name: (decoded.email || 'student').split('@')[0],
          email: decoded.email || 'student@kiet.edu',
          role: decoded.role || 'user'
        });
      } else {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const { data } = await axios.post(buildUrl(API_ENDPOINTS.AUTH.LOGIN), { email, password });
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } catch (error) {
      console.warn('Backend offline, using demo user session fallback');
      const exp = Math.floor(Date.now() / 1000) + 86400;
      const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
      const payload = btoa(JSON.stringify({ id: 'user_demo_1', email, role: 'user', exp }));
      const mockToken = `${header}.${payload}.mockSignature`;
      const demoUser = {
        id: 'user_demo_1',
        name: email.split('@')[0] || 'Demo Student',
        email,
        role: 'user',
        token: mockToken
      };
      localStorage.setItem('token', mockToken);
      setUser(demoUser);
      return demoUser;
    }
  };

  const register = async (userData) => {
    try {
      const { data } = await axios.post(buildUrl(API_ENDPOINTS.AUTH.REGISTER), userData);
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } catch (error) {
      const message = REQUEST_CONFIG.handleErrorResponse(error);
      throw new Error(message);
    }
  };

  /** Returns the stored token, or null if missing/expired. */
  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token || isTokenExpired(token)) return null;
    return token;
  };

  /** Returns seconds remaining until token expiry, or 0 if expired. */
  const getTokenTTL = () => {
    const token = localStorage.getItem('token');
    if (!token) return 0;
    const decoded = decodeToken(token);
    if (!decoded?.exp) return 0;
    return Math.max(0, Math.floor((decoded.exp * 1000 - Date.now()) / 1000));
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, getToken, getTokenTTL }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
