/**
 * Centralized Axios Instance
 * 
 * Features:
 * - Automatic JWT auth header injection
 * - Global 401 auto-logout
 * - Request correlation IDs
 * - Consistent error message extraction
 * - No need for localStorage.getItem('token') in every component
 */

import axios from 'axios';
import { API_CONFIG } from '../config/api';

const api = axios.create({
  baseURL: API_CONFIG.baseUrl,
  timeout: API_CONFIG.timeout || 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// ─── Request Interceptor ─────────────────────────────────────────────────────
// Automatically attach JWT token to every outbound request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Forward correlation IDs from server responses if available
    const requestId = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    config.headers['X-Client-Request-ID'] = requestId;
    return config;
  },
  (error) => Promise.reject(error)
);

// ─── Response Interceptor ────────────────────────────────────────────────────
// Handle 401 globally — clears auth and redirects to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Dispatch a custom event so AuthContext can update
      window.dispatchEvent(new CustomEvent('auth:logout'));
      // Redirect if not already on auth pages
      const isAuthPage = ['/login', '/register', '/forgot-password'].some(p =>
        window.location.pathname.startsWith(p)
      );
      if (!isAuthPage) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Extract a user-friendly error message from an axios error
 * @param {Error} error - Axios error object
 * @returns {string} Human-readable error message
 */
export const getErrorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.response?.data?.error) return error.response.data.error;
  if (error.message === 'Network Error') return 'Unable to connect to server. Please check your internet connection.';
  if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  return error.message || 'An unexpected error occurred.';
};

export default api;
