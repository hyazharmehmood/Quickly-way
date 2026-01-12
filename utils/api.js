import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to include the auth token
api.interceptors.request.use(
  (config) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle 401 errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // If we're on login or signup pages, don't show the expiry dialog
      const isAuthPath = window.location.pathname === '/login' || window.location.pathname === '/signup';
      if (!isAuthPath) {
        // Dynamically import useAuthStore to avoid circular dependency
        const useAuthStore = require('@/store/useAuthStore').default;
        useAuthStore.getState().setShowExpiryDialog(true);
      }
    }
    return Promise.reject(error);
  }
);

export default api;

