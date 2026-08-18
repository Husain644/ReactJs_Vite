import axios from 'axios';

const api = axios.create({
  baseURL: 'https://www.techt.site/api/content',
  headers: { 'Content-Type': 'application/json' },
  timeout: 5*60*1000,   // that is 5 minutes 
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const msg = err.response?.data?.message || err.message || 'Something went wrong';
    return Promise.reject(new Error(msg));
  }
);

export default api;
