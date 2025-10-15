import axios, { type AxiosError, type AxiosResponse } from 'axios';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token and CSRF token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add CSRF token from cookie for state-changing requests
    if (
      ['POST', 'PUT', 'DELETE', 'PATCH'].includes(
        config.method?.toUpperCase() || ''
      )
    ) {
      const csrfToken = getCookie('csrf-token');
      if (csrfToken) {
        config.headers['x-csrf-token'] = csrfToken;
      }
    }

    // For FormData requests, remove the default Content-Type header
    // to let the browser set it with the correct boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Helper function to get cookie value
function getCookie(name: string): string | null {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Response interceptor for error handling
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error: AxiosError) => {
    // Handle common error scenarios
    if (error.response?.status === 401) {
      // Unauthorized - clear auth data and redirect to login
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      window.location.href = '/';
    }

    if (error.response?.status === 403) {
      // Forbidden - user doesn't have permission
      console.error('Access forbidden');
    }

    if (error.response && error.response.status >= 500) {
      // Server error
      console.error('Server error:', error.response.data);
    }

    // Network error
    if (!error.response) {
      console.error('Network error:', error.message);
    }

    return Promise.reject(error);
  }
);

// API endpoints
export const apiEndpoints = {
  // CSRF token
  initializeCSRF: () => api.get('/health'), // This endpoint sets the CSRF cookie

  // Aadhar check
  checkAadhar: (aadharNumber: string) =>
    api.post('/aadhar/check', { aadharNumber }),

  // User enrollment
  enrollUser: (userData: Record<string, unknown>) =>
    api.post('/users/enroll', userData),

  // User profile
  getUserProfile: () => api.get('/users/profile'),
  getUserById: (userId: string) => api.get(`/users/${userId}`),

  updateUserProfile: (userData: Record<string, unknown>) =>
    api.put('/users/profile', userData),
  updateUserById: (userId: string, userData: Record<string, unknown>) =>
    api.put(`/users/${userId}`, userData),

  // Document management
  uploadDocument: (userId: string, documentType: string, file: File) => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType); // Add documentType as form field

    // The request interceptor will automatically handle Content-Type for FormData
    return api.post(`/documents/${userId}/upload`, formData);
  },

  getAllUserDocuments: (userId: string) => api.get(`/documents/${userId}`),

  getDocument: (userId: string, documentType: string) =>
    api.get(`/documents/${userId}/${documentType}`),

  // References
  addReferences: (userId: string, references: Record<string, unknown>[]) =>
    api.post(`/references/${userId}`, { references }),

  getReferences: (userId: string) => api.get(`/references/${userId}`),

  getReferredContacts: (userId: string) =>
    api.get(`/references/${userId}/referred`),
};

export default api;
