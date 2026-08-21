import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:9000',
});

function isLoginRequest(config) {
  return /\/v1\/auth\/login\/?$/i.test(config?.url || '');
}

function shouldForceLogout(error) {
  if (error?.response?.status !== 401 || isLoginRequest(error?.config)) {
    return false;
  }

  const currentToken = localStorage.getItem('co_token');
  if (!currentToken) return false;

  const message =
    error?.response?.data?.error?.message ||
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    '';

  return /token|jwt|expir|invalid|inválid|autentic|unauthor/i.test(String(message)) || !message;
}

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('co_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (shouldForceLogout(error)) {
      localStorage.removeItem('co_token');
      localStorage.removeItem('co_user');
      window.dispatchEvent(new CustomEvent('co:auth:logout', {
        detail: { reason: 'unauthorized' },
      }));
    }
    return Promise.reject(error);
  },
);

export default api;
