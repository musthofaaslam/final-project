import { useState, useEffect } from 'react';
import { fetchEventSource } from '@microsoft/fetch-event-source';

/**
 * Custom Hook SSE dengan Header Autentikasi
 * @param {string} endpoint - Endpoint relatif SSE (misal: '/events/stream/')
 * @returns {object} { data, isConnected, error }
 */
export const useSSE = (endpoint) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!endpoint) return;

    // AbortController digunakan untuk membatalkan/menutup koneksi SSE dari client
    const controller = new AbortController();
    const token = localStorage.getItem('access_token');
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';
    const fullUrl = `${baseUrl}${endpoint}`;

    const startSSE = async () => {
      try {
        await fetchEventSource(fullUrl, {
          method: 'GET',
          headers: {
            // Suntikkan token ke Header seperti Axios
            Authorization: token ? `Bearer ${token}` : '',
            Accept: 'text/event-stream',
          },
          signal: controller.signal,

          async onopen(response) {
            if (response.ok && response.headers.get('content-type')?.includes('text/event-stream')) {
              setIsConnected(true);
              setError(null);
              console.log(`[SSE Connected] -> ${endpoint}`);
            } else if (response.status === 401) {
              setError('Autentikasi gagal atau token kedaluwarsa.');
              throw new Error('Unauthorized');
            } else {
              setError('Gagal terhubung ke stream server.');
            }
          },

          onmessage(event) {
            try {
              const parsedData = JSON.parse(event.data);
              setData(parsedData);
            } catch (err) {
              // Jika data berupa plain text
              setData(event.data);
              console.error(`[SSE Error] -> ${endpoint}:`, err);
            }
          },

          onerror(err) {
            setIsConnected(false);
            console.error(`[SSE Error] -> ${endpoint}:`, err);
            
            // Jika koneksi di-abort oleh kita sendiri (pindah halaman), abaikan error
            if (controller.signal.aborted) {
              return;
            }
            
            setError('Koneksi stream terputus.');
            // Lempar error jika ingin menghentikan auto-retry bawaan library
            throw err; 
          },
        });
      } catch (err) {
        // Mencegah unhandled rejection jika koneksi dibatalkan
        if (!controller.signal.aborted) {
          console.error('SSE connection closed with error:', err);
        }
      }
    };

    startSSE();

    // CLEANUP FUNCTION: Menutup koneksi saat komponen unmount
    return () => {
      console.log(`[SSE Cleanup] Aborting connection -> ${endpoint}`);
      controller.abort();
      setIsConnected(false);
    };
  }, [endpoint]);

  return { data, isConnected, error };
};