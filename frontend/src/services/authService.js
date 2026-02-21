import apiClient from './api';

const authService = {
  register: (data) => {
    return apiClient.post('/auth/register', data);
  },

  login: (email, password) => {
    return apiClient.post('/auth/login', { email, password });
  },

  getProfile: () => {
    return apiClient.get('/auth/profile');
  },

  updateProfile: (data) => {
    return apiClient.put('/auth/profile', data);
  },

  logout: () => {
    localStorage.removeItem('authToken');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('authToken');
  },

  getToken: () => {
    return localStorage.getItem('authToken');
  },

  setToken: (token) => {
    localStorage.setItem('authToken', token);
  },
};

export default authService;
