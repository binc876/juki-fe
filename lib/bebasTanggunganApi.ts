import axios from 'axios';

export const bebasTanggunganApi = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  },
  withCredentials: false, 
});

bebasTanggunganApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  console.log('Bebas Tanggungan Interceptor: Token from local storage:', token);
  config.headers['ngrok-skip-browser-warning'] = 'true'; // Add this line
  config.headers.Accept = 'application/json';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  console.log('Bebas Tanggungan Interceptor: Request headers:', config.headers);
  return config;
});

bebasTanggunganApi.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      alert('Sesi kamu sudah berakhir, silahkan login kembali.')
      window.location.href = '/';
    }
    return Promise.reject(err);
  }
);