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
import {
  Shield,
  Key,
  RefreshCw,
  Bell,
  Eye,
  EyeOff,
  Activity,
  Terminal,
  Layers,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  History,
  Trash2,
  Download,
  Database,
  Globe
} from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(''); // Estado separado para el input
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
    // Si ya tenemos una API Key vÁlida (cargada por localStorage o auth), suscribimos sockets
    if (!isAuthorized || !apiKey) return;

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

  const [activeTab, setActiveTab] = useState('dashboard');

  const [showKey, setShowKey] = useState(false);
  const [rememberKey, setRememberKey] = useState(true);

  // Cargar key recordada al inicio
  useEffect(() => {
    const saved = localStorage.getItem('mcp_master_key');
    if (saved) {
      setApiKeyInput(saved);
      setApiKey(saved);
      // Aquí podrías disparar fetchData automáticamente o dejar que el usuario pulse entrar
    }
  }, []);

  // Disparar fetchData cuando la apiKey real cambie (solo por load inicial o handleAuth exitoso)
  useEffect(() => {
    if (apiKey) fetchData();
  }, [apiKey, fetchData]);

  const handleAuth = async () => {
    // Solo cuando se pulsa el botón, actualizamos la apiKey REAL
    const keyToUse = apiKeyInput.trim();
    if (!keyToUse) return;

    if (rememberKey) {
      localStorage.setItem('mcp_master_key', keyToUse);
    } else {
      localStorage.removeItem('mcp_master_key');
    }

    setApiKey(keyToUse); // Esto disparará el useEffect de arriba una sola vez
  };

  if (!isAuthorized) {
    return (
      <div className="login-container">
        <div className="login-card">
          <div className="login-avatar">
            <img src="/logo.png" alt="User" />
          </div>
          <div className="login-title">
            <h2>Acceso Restringido</h2>
            <p>Master Session Key • SYMBIOSIS MCP</p>
          </div>

          <div className="pin-group" style={{ position: 'relative' }}>
            <input
              type={showKey ? "text" : "password"}
              placeholder="••••••••"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAuth()}
              className="pin-input"
            />
            <button
              onClick={() => setShowKey(!showKey)}
              style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
            <input
              type="checkbox"
              id="remember"
              checked={rememberKey}
              onChange={(e) => setRememberKey(e.target.checked)}
              style={{ accentColor: 'var(--accent)' }}
            />
            <label htmlFor="remember" style={{ fontSize: '12px', color: 'var(--text-dim)', cursor: 'pointer' }}>
              Recordar Master Key en esta estación
            </label>
          </div>

          <button onClick={handleAuth} className="auth-btn">
            Sincronizar Escudo
          </button>

          <div style={{ marginTop: '24px', opacity: 0.3, fontSize: '10px' }}>
            ARGENTEIA CORE V5 • AMBIENTE PROTEGIDO
          </div>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <Telemetry status={status} />
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 400px', gap: '32px' }}>
              <ChatPlayground models={models} onSendMessage={handleSendMessage} />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                <ModelList models={models} pullProgress={pullProgress} onPull={handlePull} onDelete={handleDeleteModel} />
                <SecurityPanel blacklistedIps={status?.blacklistedIps || []} onUnban={handleUnban} onPanic={handlePanic} />
              </div>
            </div>
          </>
        );
      case 'models':
        return <ModelList models={models} pullProgress={pullProgress} onPull={handlePull} onDelete={handleDeleteModel} />;
      case 'security':
        return <IpLogs logs={status?.recentLogs} onBan={handleBan} />;
      case 'playground':
        return <ChatPlayground models={models} onSendMessage={handleSendMessage} />;
      default:
        return null;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar - ARGenteIA Style */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="logo-wrap">
            <div className="logo-icon">
              <img src="/logo.png" alt="Logo" />
            </div>
            <span className="logo-text">SYMBIOSIS</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-section">
            <span className="section-label">Sistema</span>
            <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <Activity size={18} />
              Inferencia & CPU
            </div>
            <div className={`nav-item ${activeTab === 'playground' ? 'active' : ''}`} onClick={() => setActiveTab('playground')}>
              <Terminal size={18} />
              Playground
            </div>
          </div>

          <div className="nav-section">
            <span className="section-label">Recursos</span>
            <div className={`nav-item ${activeTab === 'models' ? 'active' : ''}`} onClick={() => setActiveTab('models')}>
              <Layers size={18} />
              Model Repository
            </div>
          </div>

          <div className="nav-section">
            <span className="section-label">Seguridad</span>
            <div className={`nav-item ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
              <Shield size={18} />
              Acceso & Tráfico
            </div>
          </div>

          <div className="nav-section" style={{ marginTop: 'auto' }}>
            <div className="nav-item" onClick={handleCleanWorkspace} style={{ color: 'var(--text-muted)' }}>
              <RefreshCw size={18} />
              Clean Temporal
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="status-badge">
            <div className="status-led online" />
            <span>Escudo Activo</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="view-area">
        <header className="view-header">
          <div className="header-info">
            <h2>{activeTab.toUpperCase()}</h2>
            <p>{status?.loadedModels?.length || 0} Modelos en Memoria VRAM</p>
          </div>

          <div className="flex-between gap-md">
            <button onClick={fetchData} className="btn-icon" title="Refrescar Estado">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', border: '1px solid rgba(255,255,255,0.1)' }}>
              AD
            </div>
          </div>
        </header>

        <div className="view-body">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default App;
