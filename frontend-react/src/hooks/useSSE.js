import { useState, useEffect } from 'react';

export function useSSE(endpoint) {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const sseUrl = `${API_BASE_URL}${endpoint}`;
    
    // Inisialisasi Native EventSource API
    const eventSource = new EventSource(sseUrl);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onmessage = (event) => {
      try {
        const parsedData = JSON.parse(event.data);
        setData(parsedData);
      } catch (err) {
        setData(event.data);
        console.error("Error parsing SSE data:", err);
      }
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      setIsConnected(false);
      setError("Koneksi SSE terputus");
      eventSource.close();
    };

    // Cleanup: tutup koneksi SSE saat komponen unmount
    return () => {
      eventSource.close();
    };
  }, [endpoint]);

  return { data, isConnected, error };
}