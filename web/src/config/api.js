/**
 * Frontend API Configuration
 * Environment-based API URLs and settings
 */

// Environment detection
const getEnvironment = () => {
  // Check hostname to determine environment
  const hostname = window?.location?.hostname || 'localhost';
  
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'development';
  } else if (hostname.includes('staging') || hostname.includes('test')) {
    return 'staging';
  } else {
    return 'production';
  }
};

const env = getEnvironment();

// API configuration for different environments
const apiConfig = {
  development: {
    baseUrl: import.meta.env?.VITE_API_URL || 'http://localhost:5000/api',
    wsUrl: import.meta.env?.VITE_WS_URL || 'http://localhost:5000',
    timeout: 30000,
    retries: 3
  },
  staging: {
    baseUrl: import.meta.env?.VITE_API_URL || 'https://api-staging.your-domain.com/api',
    wsUrl: import.meta.env?.VITE_WS_URL || 'https://api-staging.your-domain.com',
    timeout: 25000,
    retries: 2
  },
  production: {
    baseUrl: import.meta.env?.VITE_API_URL || '/api', // Same-origin in production
    wsUrl: import.meta.env?.VITE_WS_URL || window?.location?.origin,
    timeout: 20000,
    retries: 1
  }
};

// Get current environment config
const config = apiConfig[env] || apiConfig.development;

// API client configuration
export const API_CONFIG = {
  ...config,
  environment: env,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
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
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    PROFILE: '/auth/profile',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    UPDATE_PROFILE: '/auth/update-profile'
  },
  
  // User endpoints
  USER: {
    DASHBOARD: '/user/dashboard',
    BOOKINGS: '/bookings/my',
    FAVORITES: '/user/favorites',
    REVIEWS: '/user/reviews',
    PAYMENTS: '/user/payments'
  },
  
  // Company endpoints
  COMPANY: {
    CREATE: '/company/create',
    DASHBOARD: '/company/dashboard',
    PROFILE: '/company/profile',
    STAFF: '/company/staff',
    SERVICES: '/company/services',
    BOOKINGS: '/company/bookings',
    EARNINGS: '/company/earnings'
  },
  
  // Experts endpoints
  EXPERTS: {
    PROFILE: '/experts/profile',
    STAFF: '/experts/:expertId/staff',
    SLOTS: '/experts/slots'
  },
  
  // Services
  SERVICES: {
    LIST: '/services',
    CREATE: '/services/create',
    UPDATE: '/services/:id',
    DELETE: '/services/:id',
    CATEGORIES: '/services/categories'
  },
  
  // Bookings
  BOOKINGS: {
    CREATE: '/bookings',
    UPDATE: '/bookings/:id',
    CANCEL: '/bookings/:id/status',
    HISTORY: '/bookings/my'
  },
  
  // Chat
  CHAT: {
    MESSAGES: '/messages/:bookingId',
    SEND: '/chat/send',
    HISTORY: '/chat/history'
  },
  
  // Payments
  PAYMENTS: {
    INTENT: '/payments/create-payment-intent',
    CONFIRM: '/payments/confirm',
    REFUND: '/payments/refund/:bookingId'
  },
  
  // Notifications
  NOTIFICATIONS: {
    LIST: '/notifications',
    MARK_READ: '/notifications/:id/read',
    MARK_ALL_READ: '/notifications/mark-all-read'
  },
  
  // Analytics
  ANALYTICS: {
    DASHBOARD: '/analytics/dashboard',
    REVENUE: '/analytics/revenue',
    BOOKINGS: '/analytics/bookings'
  },

  // Admin endpoints
  ADMIN: {
    STATS: '/admin/stats',
    USERS: '/admin/users',
    TOGGLE_EXPERT: '/admin/experts/:id/toggle',
    BAN_USER: '/admin/users/:id/ban',
    DELETE_USER: '/admin/users/:id'
  },
  
  // Public endpoints
  PUBLIC: {
    GLOBAL_STATS: '/public/global-stats',
    COMPANY_PROFILE: '/public/company/:id',
    REVIEWS: '/public/company/:id/reviews'
  }
};

// Helper to build full URLs
export const buildUrl = (endpoint, params = {}) => {
  let url = `${API_CONFIG.baseUrl}${endpoint}`;
  
  // Replace path parameters (e.g., :id)
  Object.keys(params).forEach(key => {
    url = url.replace(`:${key}`, params[key]);
  });
  
  return url;
};

// Error handling configuration
export const ERROR_CONFIG = {
  timeout: 'Request timed out. Please try again.',
  network: 'Network error. Please check your connection.',
  unauthorized: 'Please login to continue.',
  forbidden: 'You do not have permission to perform this action.',
  notFound: 'The requested resource was not found.',
  serverError: 'Server error. Please try again later.',
  default: 'An error occurred. Please try again.'
};

// Request interceptor configuration
export const REQUEST_CONFIG = {
  // Add auth token to requests
  addAuthHeader: (token) => ({
    'Authorization': `Bearer ${token}`
  }),
  
  // Handle common errors
  handleErrorResponse: (error) => {
    const status = error.response?.status;
    const message = error.response?.data?.message || ERROR_CONFIG.default;
    
    if (status === 401) {
      // Redirect to login
      window.location.href = '/login';
      return ERROR_CONFIG.unauthorized;
    } else if (status === 403) {
      return ERROR_CONFIG.forbidden;
    } else if (status === 404) {
      return ERROR_CONFIG.notFound;
    } else if (status >= 500) {
      return ERROR_CONFIG.serverError;
    }
    
    return message;
  }
};

export default API_CONFIG;
