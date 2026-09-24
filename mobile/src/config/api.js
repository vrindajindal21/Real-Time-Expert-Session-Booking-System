import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { Platform } from 'react-native';

/**
 * Mobile API Configuration
 * Environment-based API URLs and settings for React Native
 */

// Environment detection for mobile
const getEnvironment = () => {
  // In production builds, this should be set via environment variables
  // For development, detect if we're in emulator/simulator
  if (__DEV__) {
    return 'development';
  }
  
  // Check environment variables (set via app.json or build process)
  const env = process.env.NODE_ENV || process.env.EXPO_PUBLIC_ENV || 'production';
  return env.toLowerCase();
};

const env = getEnvironment();

// API configuration for different environments
const apiConfig = {
  development: {
    // Support different development scenarios
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 
      (Platform.OS === 'android' ? 'http://10.0.2.2:5000/api' : 'http://localhost:5000/api'),
    wsUrl: process.env.EXPO_PUBLIC_WS_URL || 
      (Platform.OS === 'android' ? 'http://10.0.2.2:5000' : 'http://localhost:5000'),
    timeout: 30000,
    retries: 3
  },
  staging: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api-staging.your-domain.com/api',
    wsUrl: process.env.EXPO_PUBLIC_WS_URL || 'https://api-staging.your-domain.com',
    timeout: 25000,
    retries: 2
  },
  production: {
    baseUrl: process.env.EXPO_PUBLIC_API_URL || 'https://api.your-domain.com/api',
    wsUrl: process.env.EXPO_PUBLIC_WS_URL || 'https://api.your-domain.com',
    timeout: 20000,
    retries: 1
  }
};

// Get current environment config
const config = apiConfig[env] || apiConfig.development;

// Create axios instance with environment-based configuration
const api = axios.create({
  baseURL: config.baseUrl,
  timeout: config.timeout,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 401 Unauthorized
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Clear stored auth and redirect to login
      try {
        await AsyncStorage.multiRemove(['auth_token', 'user_data']);
      } catch (storageError) {
        console.warn('Failed to clear auth storage:', storageError);
      }
      
      // Navigate to login (this should be handled by the auth context)
      return Promise.reject(error);
    }
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    
    // Handle other HTTP errors
    const message = error.response.data?.message || error.response.data?.error || 'Request failed';
    return Promise.reject(new Error(message));
  }
);

// Export configuration for other parts of the app
export const API_CONFIG = {
  ...config,
  environment: env,
  isDevelopment: env === 'development',
  isProduction: env === 'production'
};

// WebSocket configuration
export const WS_CONFIG = {
  url: config.wsUrl,
  options: {
    transports: ['websocket', 'polling'],
    timeout: config.timeout,
    reconnection: true,
    reconnectionAttempts: config.retries,
    reconnectionDelay: 1000,
    autoConnect: true
  }
};

// API endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password'
  },
  USER: {
    DASHBOARD: '/user/dashboard',
    BOOKINGS: '/bookings/my',
    FAVORITES: '/user/favorites',
    REVIEWS: '/user/reviews'
  },
  COMPANY: {
    CREATE: '/company/create',
    DASHBOARD: '/company/dashboard',
    PROFILE: '/company/profile',
    STAFF: '/company/staff',
    SERVICES: '/company/services',
    BOOKINGS: '/company/bookings'
  },
  SERVICES: {
    LIST: '/services',
    CREATE: '/services/create',
    CATEGORIES: '/services/categories'
  },
  BOOKINGS: {
    CREATE: '/bookings',
    UPDATE: '/bookings/:id',
    CANCEL: '/bookings/:id/status'
  },
  CHAT: {
    MESSAGES: '/chat/messages/:bookingId',
    SEND: '/chat/send',
    HISTORY: '/chat/history'
  },
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read'
  },
  PUBLIC: {
    GLOBAL_STATS: '/public/global-stats',
    COMPANY_PROFILE: '/public/company/:id'
  }
};

export default api;
