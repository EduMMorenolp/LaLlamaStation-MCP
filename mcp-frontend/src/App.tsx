import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Telemetry } from './components/Telemetry';
import { IpLogs } from './components/IpLogs';
import { SecurityPanel } from './components/SecurityPanel';
import { ModelList } from './components/ModelList';
import { ChatPlayground } from './components/ChatPlayground';
import {
  socket,
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

    const cleanupPull = subscribeToPullProgress((data) => setPullProgress(data));
    const cleanupAlerts = subscribeToSecurityAlerts((data) => {
      setNotifications(prev => [{ ...data, id: Date.now() }, ...prev].slice(0, 5));
      if (data.type === 'ban') fetchData(); // Refresh if someone was banned
    });
    const cleanupAccess = subscribeToNewAccess((data) => {
      setNotifications(prev => [{ ...data, type: 'info', id: Date.now() }, ...prev].slice(0, 5));
      fetchData(); // Refresh logs
    });

    return () => {
      cleanupPull();
      cleanupAlerts();
      cleanupAccess();
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
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="glass p-8 w-full max-w-md text-center">
          <div className="bg-indigo-500/20 p-4 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Shield size={40} className="text-indigo-400" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-white">Ollama MCP Shield</h1>
          <p className="text-slate-400 mb-8">Ingresa tu API Master Key para acceder al Dashboard</p>

          <div className="relative mb-6">
            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
            <input
              type="password"
              placeholder="API_KEY"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full bg-slate-800 border-none rounded-xl py-3 pl-10 pr-4 text-white focus:ring-2 focus:ring-indigo-500 outline-none"
            />
          </div>

          <button
            onClick={fetchData}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            ENTRAR AL SISTEMA
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 md:p-8 max-w-[1600px] mx-auto">
      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
            DASHBOARD MCP OLLAMA
          </h1>
          <p className="text-slate-500 flex items-center gap-2 mt-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            Servidor Protegido e Inteligente activo
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative group">
            <Bell size={20} className="text-slate-400 cursor-pointer hover:text-white" />
            {notifications.length > 0 && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />}

            {/* Notification Dropdown (Tooltip-like) */}
            <div className="absolute right-0 top-full mt-2 w-72 glass p-2 hidden group-hover:block z-50">
              {notifications.length === 0 ? <p className="text-xs p-2 text-slate-500">Sin notificaciones</p> :
                notifications.map(n => (
                  <div key={n.id} className="text-[10px] p-2 border-b border-white/5 last:border-none">
                    <span className="font-bold text-indigo-400">[{n.type}]</span> {n.message || n.action}
                  </div>
                ))
              }
            </div>
          </div>
          <button
            onClick={fetchData}
            className="p-2 bg-slate-800 rounded-lg hover:bg-slate-700 transition-colors"
            title="Sincronizar"
          >
            <RefreshCw size={18} className={`text-slate-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={handleCleanWorkspace}
            className="p-2 bg-slate-800 rounded-lg hover:bg-indigo-500/30 transition-colors text-xs font-bold text-slate-400 hover:text-indigo-400"
            title="Limpiar temporales"
          >
            CLEAN
          </button>
          <div className="h-8 w-px bg-slate-800 mx-2" />
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-white">Administrador</p>
              <p className="text-[10px] text-slate-500">Master Key</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-bold text-xs">
              AD
            </div>
          </div>
        </div>
      </header>

      <Telemetry status={status} />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 flex flex-col gap-6">
          <ChatPlayground models={models} onSendMessage={handleSendMessage} />
          <IpLogs logs={status?.recentLogs} onBan={handleBan} />
        </div>

        <div className="col-span-12 lg:col-span-4 flex flex-col gap-6">
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

      <footer className="mt-12 text-center text-slate-600 text-xs">
        &copy; 2026 OLLAMA MCP PROTECTED SERVER - DESARROLLO SEGURO FASE 5
      </footer>
    </div>
  );
};

export default App;
