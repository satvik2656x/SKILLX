import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('skillx_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;

  // If sending FormData, let the browser set Content-Type with boundary automatically
  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
  } else {
    config.headers['Content-Type'] = 'application/json';
  }

  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('skillx_token');
      localStorage.removeItem('skillx_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export default api;
