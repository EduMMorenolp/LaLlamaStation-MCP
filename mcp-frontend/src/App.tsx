import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Telemetry } from './components/Telemetry';
import { IpLogs } from './components/IpLogs';
import { SecurityPanel } from './components/SecurityPanel';
import { ModelList } from './components/ModelList';
import { ChatPlayground } from './components/ChatPlayground';
import { HardwareSentinel } from './components/HardwareSentinel';
import { AiEngineTuner } from './components/AiEngineTuner';
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
  Cpu,
  Zap
} from 'lucide-react';

const App: React.FC = () => {
  const [apiKey, setApiKey] = useState('');
  const [apiKeyInput, setApiKeyInput] = useState(''); // Estado separado para el input
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [status, setStatus] = useState<any>(null);
  const [models, setModels] = useState<any[]>([]);
  const [pullProgress, setPullProgress] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const fetchData = useCallback(async () => {
    if (!apiKey) return;
    try {
      const [statusRes, modelsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/status`, { headers: { 'x-api-key': apiKey } }),
        axios.get(`${API_BASE}/api/models`, { headers: { 'x-api-key': apiKey } })
      ]);
      setStatus(statusRes.data);
      setModels(modelsRes.data.models || []);
      setIsAuthorized(true);
      localStorage.setItem('llama_master_key', apiKey);
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

    const cleanupPull = subscribeToPullProgress((data) => {
      if (data.status === 'done') {
        // Descarga completada — limpiar progreso y refrescar lista de modelos
        setPullProgress(null);
        fetchData();
      } else {
        setPullProgress(data);
      }
    });
    const cleanupAlerts = subscribeToSecurityAlerts((data) => {
      if (data.type === 'ban') fetchData(); // Solo refrescar en caso de baneo
    });
    const subAccess = subscribeToNewAccess(cleanupAccess);

    return () => {
      cleanupPull();
      cleanupAlerts();
      subAccess();
    };
  }, [apiKey, fetchData, isAuthorized]);

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
    const saved = localStorage.getItem('llama_master_key');
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

  const handleAuth = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const keyToUse = apiKeyInput.trim();
    if (!keyToUse) return;

    setIsAuthenticating(true);
    setAuthError('');

    try {
      const [statusRes, modelsRes] = await Promise.all([
        axios.get(`${API_BASE}/api/status`, { headers: { 'x-api-key': keyToUse } }),
        axios.get(`${API_BASE}/api/models`, { headers: { 'x-api-key': keyToUse } })
      ]);
      setStatus(statusRes.data);
      setModels(modelsRes.data.models || []);
      setIsAuthorized(true);
      setApiKey(keyToUse);
      if (rememberKey) {
        localStorage.setItem('llama_master_key', keyToUse);
      } else {
        localStorage.removeItem('llama_master_key');
      }
    } catch (err: any) {
      setIsAuthorized(false);
      let errorMsg = 'Error de conexión con el servidor MCP';
      if (err.response?.status === 401) errorMsg = 'Acceso denegado: PIN incorrecto o inválido';
      if (err.response?.status === 403) errorMsg = 'Acceso denegado: IP bloqueada temporalmente temporalmente por seguridad';
      setAuthError(errorMsg);
    } finally {
      setIsAuthenticating(false);
    }
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
            <p>Master Session Key • LaLlamaStation MCP</p>
          </div>

          <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
            <div className="pin-group" style={{ position: 'relative', marginBottom: authError ? '16px' : '32px' }}>
              <input
                type={showKey ? "text" : "password"}
                placeholder="••••••••"
                value={apiKeyInput}
                onChange={(e) => { setApiKeyInput(e.target.value); setAuthError(''); }}
                className={`pin-input ${authError ? 'error' : ''}`}
                style={authError ? { borderColor: 'var(--error)', backgroundColor: 'rgba(239,68,68,0.05)' } : {}}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                {showKey ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>

            {authError && (
              <div style={{ color: 'var(--error)', fontSize: '13px', marginBottom: '24px', fontWeight: 600 }}>
                {authError}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
              <div className="custom-checkbox">
                <input
                  type="checkbox"
                  id="remember"
                  checked={rememberKey}
                  onChange={(e) => setRememberKey(e.target.checked)}
                />
                <span className="checkmark"></span>
              </div>
              <label htmlFor="remember" style={{ fontSize: '13px', color: 'var(--text-dim)', cursor: 'pointer', userSelect: 'none' }}>
                Recordar Master Key en esta estación
              </label>
            </div>

            <button type="submit" disabled={isAuthenticating} className="auth-btn" style={{ position: 'relative', opacity: isAuthenticating ? 0.7 : 1 }}>
              {isAuthenticating ? (
                <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto', display: 'block' }} />
              ) : (
                'Sincronizar Escudo'
              )}
            </button>
          </form>

          <div style={{ marginTop: '32px', opacity: 0.6, fontSize: '12px', fontWeight: 600, letterSpacing: '1px', color: 'var(--text-muted)' }}>
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
      case 'hardware': return { title: 'HARDWARE SENTINEL', sub: 'Monitor de GPU, VRAM y configuración de rendimiento' };
      case 'engine': return { title: 'AI ENGINE TUNER', sub: 'Consumo energético, contador de tokens y ahorro vs cloud' };
      default: return { title: activeTab.toUpperCase(), sub: '' };
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <>
            <Telemetry status={status} />
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) 300px', gap: '24px', alignItems: 'start', marginTop: '8px' }}>
              {/* Accesos Recientes */}
              <div className="card-glass" style={{ padding: '24px' }}>
                <h3 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-muted)', marginBottom: '20px', textTransform: 'uppercase' }}>Últimos Accesos al Perímetro</h3>
                {(status?.recentLogs?.length || 0) === 0 ? (
                  <p style={{ fontSize: '13px', opacity: 0.2, textAlign: 'center', padding: '24px' }}>Sin actividad registrada</p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {(status?.recentLogs || []).slice(0, 8).map((log: any, i: number) => (
                      <div key={`log-${i}-${log.ip}-${log.timestamp}`} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '10px 14px',
                        background: 'rgba(255,255,255,0.02)',
                        border: '1px solid var(--border-light)',
                        borderRadius: '8px'
                      }}>
                        <div style={{ width: '7px', height: '7px', borderRadius: '50%', flexShrink: 0, background: log.status === 'Success' ? 'var(--success)' : 'var(--error)' }} />
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--accent)', minWidth: '130px' }}>{log.ip}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-dim)', flex: 1 }}>{log.action || 'system_call'}</span>
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: log.status === 'Success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)', color: log.status === 'Success' ? 'var(--success)' : 'var(--error)' }}>
                          {log.status}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Panel lateral: Modelos + Estado Seguridad */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div className="card-glass" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase' }}>Modelos Disponibles</h3>
                  {(models?.length || 0) === 0 ? (
                    <p style={{ fontSize: '12px', opacity: 0.3, textAlign: 'center', padding: '16px' }}>No hay modelos instalados</p>
                  ) : (
                    (models || []).slice(0, 5).map((m: any, i: number) => (
                      <div key={m?.name || `model-${i}`} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-light)' }}>
                        <span style={{ fontSize: '12px' }}>{m?.name || 'N/A'}</span>
                        <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>
                          {m?.size ? (m.size / Math.pow(1024, 3)).toFixed(1) + 'GB' : '-'}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="card-glass" style={{ padding: '20px' }}>
                  <h3 style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '1.5px', color: 'var(--text-muted)', marginBottom: '16px', textTransform: 'uppercase' }}>IPs Bloqueadas</h3>
                  {(status?.blacklistedIps?.length || 0) === 0 ? (
                    <p style={{ fontSize: '12px', opacity: 0.3, textAlign: 'center', padding: '12px' }}>Perímetro Limpio ✓</p>
                  ) : (
                    (status?.blacklistedIps || []).map((ip: string) => (
                      <div key={ip} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--error)' }}>{ip}</span>
                        <button onClick={() => handleUnban(ip)} style={{ fontSize: '10px', padding: '2px 8px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '4px', color: 'var(--error)', cursor: 'pointer' }}>UNBAN</button>
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
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <SecurityPanel blacklistedIps={status?.blacklistedIps || []} onUnban={handleUnban} onPanic={handlePanic} />
            <IpLogs logs={status?.recentLogs} onBan={handleBan} />
          </div>
        );
      case 'playground':
        return (
          <div className="card-glass" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 160px)' }}>
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Terminal size={16} style={{ color: 'var(--accent)' }} />
              <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '2px', color: 'var(--text-dim)' }}>TERMINAL DE INFERENCIA MCP</span>
            </div>
            <div style={{ flex: 1, padding: '16px', overflow: 'hidden' }}>
              <ChatPlayground models={models} onSendMessage={handleSendMessage} />
            </div>
          </div>
        );
      case 'hardware':
        return <HardwareSentinel status={status} />;
      case 'engine':
        return <AiEngineTuner status={status} />;
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
            <span className="logo-text">LaLlamaStation</span>
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
              <span className="section-title">Opciones Rapidas</span>
            </div>
            <div className="commands-grid">
              <button className="cmd-pill" onClick={() => setActiveTab('models')}>
                <Layers size={14} /> Modelos
              </button>
              <button className="cmd-pill" onClick={() => setActiveTab('security')}>
                <Shield size={14} /> Seguridad
              </button>
              <button className="cmd-pill" onClick={() => setActiveTab('hardware')}>
                <Cpu size={14} /> HW Sentinel
              </button>
              <button className="cmd-pill" onClick={() => setActiveTab('engine')}>
                <Zap size={14} /> Engine Tuner
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
          <div className="status-badge" style={{ marginTop: '8px', padding: '0 4px' }}>
            <div className={`status-led ${status?.ollamaRunning ? 'online' : 'offline'}`} />
            <span style={{ fontWeight: 600, color: status?.ollamaRunning ? 'var(--text-main)' : 'var(--text-muted)' }}>{status?.ollamaRunning ? 'Conectado' : 'Sin conexión'}</span>
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
