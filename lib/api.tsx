import axios from 'axios';

// Instance utama
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  },
  withCredentials: false, 
});

// Queue untuk menampung request yang gagal saat token sedang direfresh
let isRefreshing = false;
let failedQueue: any[] = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  config.headers['ngrok-skip-browser-warning'] = 'true';
  config.headers.Accept = 'application/json';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Logging Request (Hanya di mode development biar console bersih di prod)
  if (process.env.NODE_ENV === 'development') {
    console.groupCollapsed(`🚀 Request: ${config.method?.toUpperCase()} ${config.url}`);
    console.log('Headers:', config.headers);
    console.log('Data:', config.data);
    console.groupEnd();
  }
  
  return config;
});

api.interceptors.response.use(
  (res) => {
    if (process.env.NODE_ENV === 'development') {
      console.groupCollapsed(`✅ Response: ${res.status} ${res.config.url}`);
      console.log('Data:', res.data);
      console.groupEnd();
    }
    return res;
  },
  async (err) => {
    const originalRequest = err.config;

    // Logging Response Error
    if (process.env.NODE_ENV === 'development') {
      console.groupCollapsed(`❌ Error: ${err.response?.status || 'Network'} ${err.config?.url}`);
      console.error('Message:', err.message);
      console.error('Response Data:', err.response?.data);
      console.groupEnd();
    }

    // Jika error 401
    if (err.response && err.response.status === 401 && !originalRequest._retry) {
      
      // Jika request yang gagal adalah Login atau Refresh Token itu sendiri, jangan coba refresh lagi
      if (originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/auth/refresh')) {
        // Logout paksa jika refresh token pun expired
        if (originalRequest.url?.includes('/auth/refresh')) {
           handleLogout();
        }
        return Promise.reject(err);
      }

      if (isRefreshing) {
        // Jika sedang refresh, masukkan request ke antrian
        return new Promise(function(resolve, reject) {
          failedQueue.push({resolve, reject});
        }).then(token => {
          originalRequest.headers['Authorization'] = 'Bearer ' + token;
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
         handleLogout();
         return Promise.reject(err);
      }

      try {
        console.log('🔄 Mencoba refresh token...');
        const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`, {}, {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
              'ngrok-skip-browser-warning': 'true'
            }
        });

        if (res.data && res.data.accessToken) {
           console.log('✅ Refresh token berhasil!');
           localStorage.setItem('token', res.data.accessToken);
           if (res.data.refreshToken) {
             localStorage.setItem('refreshToken', res.data.refreshToken);
           }
           
           api.defaults.headers.common['Authorization'] = 'Bearer ' + res.data.accessToken;
           originalRequest.headers['Authorization'] = 'Bearer ' + res.data.accessToken;
           
           processQueue(null, res.data.accessToken);
           return api(originalRequest);
        } else {
           throw new Error('No access token returned');
        }
      } catch (refreshErr) {
        console.error('❌ Gagal refresh token:', refreshErr);
        processQueue(refreshErr, null);
        handleLogout();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(err);
  }
);

function handleLogout() {
  localStorage.removeItem('token');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  
  // Hindari loop redirect
  if (typeof window !== 'undefined' && window.location.pathname !== '/') {
     // Dispatch custom event for AlertProvider to catch
     const event = new CustomEvent('global-alert', {
        detail: {
            title: 'Sesi Berakhir',
            message: 'Ups, sesi kamu telah berakhir! 😅\n\nDemi keamanan akun, silakan login kembali untuk melanjutkan aktivitas ya.',
            type: 'warning',
            onConfirm: () => { window.location.href = '/'; }
        }
     });
     window.dispatchEvent(event);
  }
}