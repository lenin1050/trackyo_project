import axios from 'axios';

const api = axios.create({
  baseURL: 'https://trackyo-project1.onrender.com/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto attach JWT token to headers if present in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('trackyo-token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

export default api;
