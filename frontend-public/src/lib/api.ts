import axios, { type AxiosError, type AxiosResponse } from 'axios';

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

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
    return api.post(`/documents/${userId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      params: { documentType },
    });
  },

  getAllUserDocuments: (userId: string) => api.get(`/documents/${userId}`),

  getDocument: (userId: string, documentType: string) =>
    api.get(`/documents/${userId}/${documentType}`),

  // References
  addReferences: (userId: string, references: Record<string, unknown>[]) =>
    api.post(`/references/${userId}`, { references }),

  getReferences: (userId: string) => api.get(`/references/${userId}`),
};

export default api;
