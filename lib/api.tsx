import axios from 'axios';

// Instance utama
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  headers: {
    'ngrok-skip-browser-warning': 'true'
  },
  withCredentials: true, 
});

// Helper untuk mengekstrak pesan error yang user-friendly
export const getErrorMessage = (error: any): string => {
  if (!error) return 'Terjadi kesalahan tidak dikenal.';

  if (error.response) {
    let data = error.response.data;
    const status = error.response.status;

    // 0. Coba parse jika data adalah string JSON (kasus content-type mismatch)
    if (typeof data === 'string') {
        try {
            const parsed = JSON.parse(data);
            // Jika berhasil parse dan hasilnya object, gunakan itu
            if (typeof parsed === 'object' && parsed !== null) {
                data = parsed;
            }
        } catch (e) {
            // Jika bukan JSON, gunakan string tersebut langsung jika pendek (pesan error raw)
            // Tapi jika string HTML panjang (misal error page nginx), fallback ke status
            if (data.length < 200 && !data.trim().startsWith('<')) {
                return data;
            }
        }
    }

    // 1. Cek jika backend mengirim field 'message'
    if (data?.message) {
      if (typeof data.message === 'string') return data.message;
      if (Array.isArray(data.message)) return data.message.join(', ');
      // Handle nested object (e.g. NestJS class-validator)
      if (typeof data.message === 'object') {
          if (Array.isArray(data.message.message)) return data.message.message.join(', ');
          if (typeof data.message.message === 'string') return data.message.message;
      }
      return JSON.stringify(data.message);
    }

    // 2. Cek field 'error'
    if (data?.error && typeof data.error === 'string') return data.error;

    // 3. Fallback berdasarkan Status Code jika body kosong atau tidak terbaca
    if (status === 400) return 'Permintaan tidak valid.';
    if (status === 401) return 'Email atau password salah / Sesi berakhir.';
    if (status === 403) return 'Anda tidak memiliki akses untuk aksi ini.';
    if (status === 404) return 'Data tidak ditemukan.';
    if (status === 429) return 'Terlalu banyak permintaan, coba lagi nanti.';
    if (status >= 500) return 'Terjadi kesalahan pada server kami.';
  }

  // 4. Fallback ke error message bawaan (misal: Network Error)
  return error.message || 'Terjadi kesalahan jaringan.';
};

// Helper untuk download file dengan Auth Header
export const downloadFile = async (url: string, filename?: string) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf, image/*, */*'
      }
    });

    const blob = response.data;

    // Deteksi Error di dalam Blob (misal jika BE kirim 500 tapi responseType tetap blob)
    if (blob.size < 2000) {
      const text = await blob.text();
      if (text.startsWith('{')) {
        const parsed = JSON.parse(text);
        throw new Error(parsed.message || 'Gagal mengunduh file dari server.');
      }
    }

    const blobUrl = window.URL.createObjectURL(new Blob([blob]));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.href = blobUrl;
    
    // Gunakan filename dari parameter atau coba ambil dari header content-disposition jika ada
    let finalFilename = filename || 'download';
    
    // Coba extract filename dari content-disposition header (optional enhancement)
    const contentDisposition = response.headers['content-disposition'];
    if (!filename && contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
            finalFilename = filenameMatch[1];
        }
    }

    link.setAttribute('download', finalFilename);
    document.body.appendChild(link);
    link.click();
    
    // Bersihkan
    link.remove();
    window.URL.revokeObjectURL(blobUrl);
  } catch (error: any) {
    console.error('Download failed:', error);
    throw error; // Re-throw agar komponen bisa handle error (misal show alert)
  }
};

// Helper untuk preview file di tab baru (View Only)
export const viewFile = async (url: string) => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
      headers: {
        'Accept': 'application/pdf'
      }
    });

    const blob = response.data;

    // VALIDASI: Jika ukuran file terlalu kecil (misal < 1KB) dan tipenya JSON atau teks, 
    // kemungkinan besar ini adalah error JSON dari BE yang terbungkus Blob.
    if (blob.size < 2000) {
      const text = await blob.text();
      if (text.startsWith('{') && text.includes('options')) {
        console.error('❌ BE Error detected: Backend sent StreamableFile as JSON string.', text);
        throw new Error('Gagal memuat PDF: Back-End mengirimkan format data yang salah (JSON instead of Binary). Mohon periksa LoggingInterceptor di BE.');
      }
      if (text.startsWith('{') && text.includes('message')) {
        const parsed = JSON.parse(text);
        throw new Error(parsed.message || 'Gagal memuat file.');
      }
    }

    const contentType = response.headers['content-type'] || blob.type || 'application/pdf';
    const blobUrl = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
    
    // Buka di tab baru
    const newTab = window.open(blobUrl, '_blank');
    if (!newTab) {
      throw new Error('Pop-up diblokir! Harap izinkan pop-up untuk melihat dokumen.');
    }
    
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
  } catch (error: any) {
    console.error('View failed:', error);
    throw error;
  }
};

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
      const status = err.response?.status;
      const url = err.config?.url;
      
      // Gunakan warn untuk Client Error (4xx) agar tidak dianggap System Crash
      if (status && status >= 400 && status < 500) {
          console.groupCollapsed(`⚠️ API Warning: ${status} ${url}`);
          console.warn('Message:', err.message);
          console.warn('Response Data:', err.response?.data);
          console.groupEnd();
      } else {
          // Gunakan error untuk Server Error (5xx) atau Network Error
          console.groupCollapsed(`❌ API Error: ${status || 'Network'} ${url}`);
          console.error('Message:', err.message);
          console.error('Response Data:', err.response?.data);
          console.groupEnd();
      }
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