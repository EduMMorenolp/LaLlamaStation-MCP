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
  RefreshCw,
  Eye,
  EyeOff,
  Activity,
  Terminal,
  Layers,
  Cpu
} from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(''); // Estado separado para el input
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [pullProgress, setPullProgress] = useState<any>(null);
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

  const getSectionInfo = () => {
    switch (activeTab) {
      case 'dashboard': return { title: 'DASHBOARD', sub: 'Sistema Operando en Tiempo Real' };
      case 'playground': return { title: 'PLAYGROUND', sub: 'Terminal de Inferencia Directa' };
      case 'models': return { title: 'REPOSITORIO DE MODELOS', sub: 'Gestiona tu Arsenal de LLMs Locales' };
      case 'security': return { title: 'CENTRO DE SEGURIDAD', sub: `${status?.recentLogs?.length || 0} Sesiones Registradas` };
      default: return { title: activeTab.toUpperCase(), sub: '' };
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <Telemetry status={status} />
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 360px', gap: '24px', alignItems: 'start' }}>
              <div className="card-glass" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', minHeight: '520px' }}>
                <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Terminal size={16} style={{ color: 'var(--accent)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-dim)' }}>PLAYGROUND</span>
                </div>
                <div style={{ flex: 1, padding: '16px' }}>
                  <ChatPlayground models={models} onSendMessage={handleSendMessage} />
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <SecurityPanel blacklistedIps={status?.blacklistedIps || []} onUnban={handleUnban} onPanic={handlePanic} />
                <div className="card-glass" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase' }}>Modelos Disponibles</h3>
                  {models?.length === 0 ? (
                    <p style={{ fontSize: '12px', opacity: 0.3, textAlign: 'center', padding: '16px' }}>No hay modelos instalados</p>
                  ) : (
                    models.slice(0, 4).map((m: any) => (
                      <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '12px' }}>{m.name}</span>
                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>{(m.size / Math.pow(1024, 3)).toFixed(1)}GB</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        );
      case 'models':
        return <ModelList models={models} pullProgress={pullProgress} onPull={handlePull} onDelete={handleDeleteModel} />;
      case 'security':
        return <IpLogs logs={status?.recentLogs} onBan={handleBan} />;
      case 'playground':
        return (
          <div className="card-glass" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 220px)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-dim)' }}>TERMINAL MCP</span>
            </div>
            <div style={{ flex: 1, padding: '16px' }}>
              <ChatPlayground models={models} onSendMessage={handleSendMessage} />
            </div>
          </div>
        );
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

        <nav className="sidebar-nav scrollbar-hide">
          <div className="nav-section">
            <div className="section-header">
              <span className="section-title">Navegación</span>
            </div>
            <div className="experts-list">
              <div
                className={`expert-item-wrap ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
              >
                <div className="expert-avatar">
                  <Activity size={16} />
                </div>
                <div className="expert-info">
                  <span className="expert-name">Dashboard</span>
                  <span className="expert-model">Control de Sistema</span>
                </div>
              </div>

              <div
                className={`expert-item-wrap ${activeTab === 'playground' ? 'active' : ''}`}
                onClick={() => setActiveTab('playground')}
              >
                <div className="expert-avatar">
                  <Terminal size={16} />
                </div>
                <div className="expert-info">
                  <span className="expert-name">Playground</span>
                  <span className="expert-model">Inferencia Directa</span>
                </div>
              </div>
            </div>
          </div>

          <div className="nav-section">
            <div className="section-header">
              <span className="section-title">Opciones Rápidas</span>
            </div>
            <div className="commands-grid">
              <button className="cmd-pill" onClick={() => setActiveTab('models')}>
                <Layers size={14} /> Modelos
              </button>
              <button className="cmd-pill" onClick={() => setActiveTab('security')}>
                <Shield size={14} /> Seguridad
              </button>
            </div>
          </div>

          <div className="nav-section" style={{ marginTop: 'auto' }}>
            <div className="section-header">
              <span className="section-title">Mantenimiento</span>
            </div>
            <div className="experts-list">
              <div className="expert-item-wrap" onClick={handleCleanWorkspace}>
                <div className="expert-avatar" style={{ color: 'var(--text-muted)' }}>
                  <RefreshCw size={16} />
                </div>
                <div className="expert-info">
                  <span className="expert-name">Limpiar Cache</span>
                  <span className="expert-model">Archivos Temporales</span>
                </div>
              </div>
            </div>
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="model-badge" style={{ marginBottom: '12px', background: 'rgba(79, 140, 255, 0.05)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <Cpu size={12} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '11px', fontWeight: 600 }}>MOTOR OLLAMA</span>
            </div>
            <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
              {models?.length || 0} Modelos Disponibles
            </div>
          </div>
          <div className="conn-status-wrap">
            <div className={`status-led ${status?.ollamaRunning ? 'online' : 'offline'}`} />
            <span className="status-label">{status?.ollamaRunning ? 'Conectado' : 'Sin conexión'}</span>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="view-area">
        <header className="view-header">
          <div className="header-info">
            <h2>{getSectionInfo().title}</h2>
            <p>{getSectionInfo().sub}</p>
          </div>

          <div className="flex-between gap-md">
            <button onClick={fetchData} className="btn-icon" title="Refrescar Estado">
              <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
            </button>
            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'linear-gradient(135deg, var(--accent), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '13px', border: '1px solid rgba(255,255,255,0.1)' }}>
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
