import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Telemetry } from './components/Telemetry';
import { IpLogs } from './components/IpLogs';
import { SecurityPanel } from './components/SecurityPanel';
import { ModelList } from './components/ModelList';
import { ChatPlayground } from './components/ChatPlayground';
import {
  subscribeToPullProgress,
  subscribeToSecurityAlerts,
  subscribeToNewAccess
} from './services/socket.service';
import { Shield, Key, RefreshCw, Bell } from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('mcp_api_key') || '');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [pullProgress, setPullProgress] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchData = useCallback(async () => {
    if (!apiKey) return;
    try {
      const [statusRes, modelsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/status`, { headers: { 'x-api-key': apiKey } }),
        axios.get(`${API_BASE}/v1/models`, { headers: { 'x-api-key': apiKey } })
      ]);
      setStatus(statusRes.data);
      setModels(modelsRes.data.data);
      setIsAuthorized(true);
      localStorage.setItem('mcp_api_key', apiKey);
    } catch (err) {
      setIsAuthorized(false);
      console.error("Auth failed", err);
    }
  }, [apiKey, API_BASE]);

  useEffect(() => {
    if (apiKey) fetchData();

    const cleanupAccess = (data: any) => {
      // Generar ID único usando timestamp + random para evitar duplicados en React keys
      const notificationId = `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      setNotifications(prev => [{ ...data, type: 'info', id: notificationId }, ...prev].slice(0, 5));

      setStatus((prevStatus: any) => {
        if (!prevStatus) return prevStatus;
        // Evitar que logs duplicados entren por streaming rápido
        const isDuplicate = prevStatus.recentLogs?.some((l: any) => l.timestamp === data.timestamp && l.ip === data.ip);
        if (isDuplicate) return prevStatus;

        const newLogs = [data, ...(prevStatus.recentLogs || [])].slice(0, 100);
        return { ...prevStatus, recentLogs: newLogs };
      });
    };

    const cleanupPull = subscribeToPullProgress((data) => setPullProgress(data));
    const cleanupAlerts = subscribeToSecurityAlerts((data) => {
      setNotifications(prev => [{ ...data, id: Date.now() }, ...prev].slice(0, 5));
      if (data.type === 'ban') fetchData(); // Solo refrescar en caso de baneo
    });
    const subAccess = subscribeToNewAccess(cleanupAccess);

    return () => {
      cleanupPull();
      cleanupAlerts();
      subAccess();
    };
  }, [apiKey, fetchData]);

  const handleSendMessage = async (model: string, content: string, options: any) => {
    const res = await axios.post(`${API_BASE}/v1/chat/completions`, {
      model,
      messages: [{ role: 'user', content }],
      ...options
    }, { headers: { 'x-api-key': apiKey } });

    return res.data.choices[0].message;
  };

  const handleBan = async (ip: string) => {
    await axios.post(`${API_BASE}/api/ban`, { ip }, { headers: { 'x-api-key': apiKey } });
    fetchData();
  };

  const handleUnban = async (ip: string) => {
    await axios.post(`${API_BASE}/api/unban`, { ip }, { headers: { 'x-api-key': apiKey } });
    fetchData();
  };

  const handlePanic = async () => {
    await axios.post(`${API_BASE}/api/unload`, {}, { headers: { 'x-api-key': apiKey } });
    fetchData();
  };

  const handleCleanWorkspace = async () => {
    try {
      setLoading(true);
      const res = await axios.post(`${API_BASE}/api/clean`, {}, { headers: { 'x-api-key': apiKey } });
      alert(`¡Limpieza completada! Se han liberado ${res.data.freed.toFixed(2)} GB de archivos temporales.`);
      fetchData();
    } catch (err: any) {
      alert("Error al limpiar workspace: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteModel = async (name: string) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el modelo ${name}? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`${API_BASE}/api/models/${name}`, { headers: { 'x-api-key': apiKey } });
      fetchData();
    } catch (err: any) {
      alert("Error al eliminar el modelo: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePull = async (model: string) => {
    // La herramienta MCP pull_model se puede llamar via un endpoint similar
    // Por simplicidad, asumimos que el servidor maneja el pull y emite via socket
    try {
      await axios.post(`${API_BASE}/api/pull`, { model }, { headers: { 'x-api-key': apiKey } });
    } catch (e: any) {
      alert(e.response?.data?.error || "Error al iniciar descarga");
    }
  };

  if (!isAuthorized) {
    return (
      <div className="flex-center" style={{ minHeight: '100vh' }}>
        <div className="bg-cosmic" />
        <div className="card-glass p-8 w-full animate-fade" style={{ maxWidth: '400px', textAlign: 'center' }}>
          <div className="flex-center mb-6">
            <img src="/logo.png" alt="Logo" style={{ width: '100px', filter: 'drop-shadow(0 0 20px var(--primary-glow))' }} />
          </div>
          <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Ollama MCP Shield</h1>
          <p style={{ marginBottom: '2rem' }}>Master Key Required</p>

          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Key style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', opacity: 0.5 }} size={18} />
            <input
              type="password"
              placeholder="API_KEY"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="input-field"
              style={{ paddingLeft: '40px' }}
            />
          </div>

          <button
            onClick={fetchData}
            className="btn btn-primary"
            style={{ width: '100%' }}
          >
            ENTRAR AL SISTEMA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="bg-cosmic" />

      {/* Toasts */}
      <div className="toast-container">
        {notifications.map(n => (
          <div key={n.id} className={`toast toast-${n.type === 'error' ? 'error' : 'info'}`}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: n.type === 'error' ? 'var(--error)' : 'var(--primary)' }} />
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>{n.type?.toUpperCase()}</p>
              <p style={{ fontSize: '0.7rem', opacity: 0.8 }}>{n.message || n.action}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Header */}
      <header className="flex-between animate-fade">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <img src="/logo.png" alt="Logo" style={{ width: '50px' }} />
          <div>
            <h1 style={{ fontSize: '1.8rem', background: 'linear-gradient(to right, var(--primary), var(--secondary))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              DASHBOARD MCP OLLAMA
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '4px' }}>
              <span style={{ width: '8px', height: '8px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }} />
              <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--success)' }}>ESCUDO ACTIVO</p>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ position: 'relative', cursor: 'pointer' }} className="group">
            <Bell size={20} className="text-dim hover:text-white" />
            {notifications.length > 0 && <span style={{ position: 'absolute', top: -2, right: -2, width: '8px', height: '8px', background: 'var(--error)', borderRadius: '50%' }} />}
          </div>

          <button onClick={fetchData} className="btn btn-secondary" title="Sincronizar">
            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
          </button>

          <button onClick={handleCleanWorkspace} className="btn btn-secondary" style={{ fontSize: '0.7rem' }}>
            CLEAN
          </button>

          <div style={{ width: '1px', height: '2rem', background: 'var(--border-light)' }} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '0.75rem', fontWeight: 800, color: 'white' }}>ADMIN</p>
              <p style={{ fontSize: '0.6rem', opacity: 0.5 }}>MASTER SESSION</p>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary)', display: 'flex', alignItems: 'center', justify- content: 'center', fontWeight: 'bold' }}>
            AD
          </div>
        </div>
    </div>
      </header >

      <Telemetry status={status} />

      <div className="grid-layout">
        <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <ChatPlayground models={models} onSendMessage={handleSendMessage} />
          <IpLogs logs={status?.recentLogs} onBan={handleBan} />
        </div>

        <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
          <ModelList
            models={models}
            pullProgress={pullProgress}
            onPull={handlePull}
            onDelete={handleDeleteModel}
          />
          <SecurityPanel
            blacklistedIps={status?.blacklistedIps || []}
            onUnban={handleUnban}
            onPanic={handlePanic}
          />
        </div>
      </div>

      <footer style={{ marginTop: 'auto', textAlign: 'center', opacity: 0.3, fontSize: '0.7rem', padding: '2rem' }}>
        &copy; 2026 OLLAMA MCP PROTECTED SERVER • ARGENTEIA CORE V5
      </footer>
    </div >
  );
};

export default App;
