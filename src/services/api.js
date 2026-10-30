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

function clearSession() {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('csrfToken');
  localStorage.removeItem('refreshToken');
}

// Shared promise: if several requests get a 401 at once, only one refresh call is made.
let refreshPromise = null;

function refreshAccessToken() {
  if (!refreshPromise) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return Promise.reject(new Error('No refresh token stored'));
    }

    refreshPromise = API.post('/auth/refreshToken', { refreshToken })
      .then((res) => {
        const newToken = res.data?.data?.accessToken;
        if (!newToken) throw new Error('No access token returned');
        localStorage.setItem('accessToken', newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

API.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;
    const isAuthRoute = original?.url?.startsWith('/auth/');

    // Only retry 401s from normal (non-auth) requests, and only once.
    if (err.response?.status !== 401 || isAuthRoute || !original) {
      return Promise.reject(err);
    }

    if (original._retried) {
      clearSession();
      window.location.href = '/login';
      return Promise.reject(err);
    }

    try {
      const newToken = await refreshAccessToken();
      original._retried = true;
      original.headers.Authorization = `Bearer ${newToken}`;
      return API(original);
    } catch {
      clearSession();
      window.location.href = '/login';
      return Promise.reject(err);
    }
  }
);

export default API;