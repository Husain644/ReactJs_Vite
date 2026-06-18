import axios from 'axios';

const api = axios.create({
  baseURL: 'https://www.techtt.site/three/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

export default api;
