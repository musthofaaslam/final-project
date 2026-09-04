import axios from 'axios';
import router from '../router/index.js';

// 1. BASE CONFIG
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// 2. REQUEST INTERCEPTOR (Kirim Access Token di HEADER)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 3. RESPONSE INTERCEPTOR (Auto Refresh Token)
api.interceptors.response.use(
  (response) => response, // Kondisi Sukses (2xx)
  
  async (error) => {
    const originalRequest = error.config;

    // Kondisi Gagal 401 & Belum Pernah Retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) throw new Error('No refresh token available');

        // Request Access Token baru (Refresh Token di BODY)
        const res = await axios.post(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'}/token/refresh/`,
          { refresh: refreshToken }
        );

        const newAccessToken = res.data.access;

        // Tulis Token Baru & Ulangi Request
        localStorage.setItem('access_token', newAccessToken);
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        // Jika refresh token juga hangus/invalid, paksa bersihkan session
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');

        if (router) {
          router.navigate('/login', { replace: true });
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;