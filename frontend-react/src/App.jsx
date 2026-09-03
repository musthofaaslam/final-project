import { useEffect, useState } from 'react';
import { fetchHealthCheck } from './services/api';
import { useSSE } from './hooks/useSSE';

function App() {
  // State untuk REST API
  const [restData, setRestData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restError, setRestError] = useState(null);

  // State untuk Form Input SSE Trigger
  const [inputText, setInputText] = useState('');

  // Custom Hook SSE (mengubah nama error dari SSE agar tidak bentrok dengan restError)
  const { data: ssePayload, isConnected, error: sseError } = useSSE('/api/sse/');

  // Handler untuk Form Submit (REST POST ke /api/trigger/)
  const handleSendTrigger = async (e) => {
    e.preventDefault();
    if (!inputText) return;

    const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    
    try {
      await fetch(`${API_BASE_URL}/api/trigger/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: inputText }),
      });
      setInputText('');
    } catch (err) {
      console.error("Gagal mengirim trigger:", err);
    }
  };

  // Lifecycle useEffect untuk REST API Health Check
  useEffect(() => {
    fetchHealthCheck()
      .then((data) => {
        setRestData(data);
        setLoading(false);
      })
      .catch((err) => {
        setRestError(err.message);
        setLoading(false);
      });
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace, sans-serif', maxWidth: '700px', margin: '0 auto' }}>
      <h2>Full-Stack Boilerplate Tester</h2>

      {/* SECTION 1: REST API HEALTH CHECK */}
      <section style={{ marginBottom: '2rem', padding: '1rem', border: '1px solid #007acc', borderRadius: '8px', background: '#f4f4f4' }}>
        <h3>REST API Status (/api/health/)</h3>
        {loading && <p>Loading REST data...</p>}
        {restError && <p style={{ color: 'red' }}>REST Error: {restError}</p>}
        {restData && (
          <pre style={{ background: '#fff', padding: '0.5rem', borderRadius: '4px' }}>
            {JSON.stringify(restData, null, 2)}
          </pre>
        )}
      </section>

      {/* SECTION 2: SSE REAL-TIME STREAM */}
      <section style={{ padding: '1rem', border: '1px solid #4CAF50', borderRadius: '8px', background: '#f9f9f9' }}>
        <h3>Real-Time SSE + Redis Pub/Sub</h3>
        
        {/* Status Koneksi */}
        <div style={{ marginBottom: '1rem', padding: '0.5rem 1rem', background: isConnected ? '#e8f5e9' : '#ffebee', borderRadius: '4px' }}>
          <strong>Status SSE: </strong>
          <span style={{ color: isConnected ? 'green' : 'red' }}>
            ● {isConnected ? 'Connected to Redis Stream' : 'Disconnected'}
          </span>
        </div>

        {sseError && <p style={{ color: 'red' }}>{sseError}</p>}

        {/* Form Trigger Event */}
        <form onSubmit={handleSendTrigger} style={{ display: 'flex', gap: '8px', marginBottom: '1rem' }}>
          <input 
            type="text" 
            placeholder="Ketik pesan live..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            style={{ flex: 1, padding: '8px' }}
          />
          <button type="submit" style={{ padding: '8px 16px', cursor: 'pointer' }}>Publish Event</button>
        </form>

        {/* Box Data Live SSE */}
        <div>
          <h4>Incoming SSE Payload:</h4>
          <pre style={{ background: '#222', color: '#00ff00', padding: '1rem', borderRadius: '4px', overflowX: 'auto' }}>
            {JSON.stringify(ssePayload, null, 2)}
          </pre>
        </div>
      </section>
    </div>
  );
}

export default App;