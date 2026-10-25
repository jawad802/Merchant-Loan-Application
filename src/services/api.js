import axios from 'axios';

const CUSTOM_ORIGIN = import.meta.env.VITE_CUSTOM_ORIGIN || 'https://issuetr3322.boltfg.com';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'https://dev-api.boltfg.com/api',
  headers: {
    'Content-Type': 'application/json',
    'Custom-Origin': CUSTOM_ORIGIN,
  },
  withCredentials: true,
});

API.interceptors.request.use((config) => {
  const isAuthRoute = config.url?.startsWith('/auth/');

  if (!isAuthRoute) {
    const accessToken = localStorage.getItem('accessToken');
    const csrfToken = localStorage.getItem('csrfToken');

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    if (csrfToken) {
      config.headers['X-CSRF-Token'] = csrfToken;
    }
  }

  return config;
});

API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !err.config?.url?.startsWith('/auth/')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('csrfToken');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default API;
