import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Database, Power, Loader, Copy, Check, Clock, Zap, BarChart2, Cpu } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const HEADERS = () => ({ 'x-api-key': localStorage.getItem('llama_master_key') || '' });

interface TelemetryProps {
    status: any;
}

export const Telemetry: React.FC<TelemetryProps> = ({ status }) => {
    const [ngrokLoading, setNgrokLoading] = useState(false);
    const [ngrokRunning, setNgrokRunning] = useState<boolean | null>(null);
    const [ngrokUrl, setNgrokUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const ngrokActive = ngrokRunning ?? (status?.ngrokInfo?.active === true);
    const displayUrl = ngrokUrl ?? status?.ngrokInfo?.url ?? null;

    const toggleNgrok = useCallback(async () => {
        setNgrokLoading(true);
        try {
            const endpoint = ngrokActive ? '/api/ngrok/stop' : '/api/ngrok/start';
            const res = await axios.post(`${API}${endpoint}`, {}, { headers: HEADERS() });
            setNgrokRunning(res.data.running);
            if (res.data.running) {
                setTimeout(async () => {
                    try {
                        const statusRes = await axios.get(`${API}/api/ngrok/status`, { headers: HEADERS() });
                        setNgrokUrl(statusRes.data.url);
                    } catch { /* aún iniciando */ }
                }, 3000);
            } else {
                setNgrokUrl(null);
            }
        } catch (e: any) {
            alert(`Error controlando ngrok: ${e?.response?.data?.error || e.message}`);
        } finally {
            setNgrokLoading(false);
        }
    }, [ngrokActive]);

    const copyUrl = () => {
        if (displayUrl) {
            navigator.clipboard.writeText(displayUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!status) return (
        <div className="card-glass p-8 flex-center animate-pulse" style={{ color: 'var(--text-dim)' }}>
            Sincronizando telemetría en tiempo real...
        </div>
    );

    const { diskSpace, loadedModels } = status;
    const freeSpace = diskSpace?.free || 0;
    const totalSpace = diskSpace?.total || 1;
    const usedPercent = ((totalSpace - freeSpace) / totalSpace) * 100;
    const isLowSpace = (freeSpace / totalSpace) < 0.1;
    const currentModel = loadedModels?.[0];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Fila 1: KPIs principales */}
            <div className="kpi-grid animate-fade">
                {/* Estado Motor */}
                <div className="kpi-card">
                    <span className="kpi-label">Motor Ollama</span>
                    <div className="flex-between">
                        <span className="kpi-value" style={{ color: status?.ollamaRunning ? 'var(--success)' : 'var(--error)', fontSize: '22px' }}>
                            {status?.ollamaRunning ? 'ONLINE' : 'OFFLINE'}
                        </span>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: status?.ollamaRunning ? 'var(--success)' : 'var(--error)', boxShadow: `0 0 10px ${status?.ollamaRunning ? 'var(--success)' : 'var(--error)'}`, animation: status?.ollamaRunning ? 'pulse 2s infinite' : 'none' }} />
                    </div>
                    {currentModel && (
                        <p style={{ fontSize: '10px', color: 'var(--success)', marginTop: '6px', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            ▶ {currentModel.name}
                        </p>
                    )}
                </div>

                {/* Almacenamiento */}
                <div className="kpi-card">
                    <span className="kpi-label">Almacenamiento</span>
                    <div className="flex-between">
                        <span className="kpi-value" style={{ fontSize: '22px' }}>
                            {freeSpace.toFixed(1)} <span style={{ fontSize: '11px', opacity: 0.5 }}>GB libres</span>
                        </span>
                        <Database size={22} style={{ opacity: 0.15 }} />
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' }}>
                        <div style={{ width: `${usedPercent}%`, height: '100%', background: isLowSpace ? 'var(--error)' : 'var(--accent)', boxShadow: `0 0 8px ${isLowSpace ? 'var(--error)' : 'var(--accent-glow)'}` }} />
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>{usedPercent.toFixed(0)}% usado de {totalSpace.toFixed(0)} GB</p>
                </div>

                {/* Ngrok */}
                <div className="kpi-card" style={{ borderColor: ngrokActive ? 'rgba(16,185,129,0.3)' : undefined }}>
                    <span className="kpi-label">Túnel Ngrok</span>
                    <div className="flex-between" style={{ marginBottom: '6px' }}>
                        <span className="kpi-value" style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: ngrokActive ? 'var(--success)' : 'var(--text-dim)' }}>
                            {ngrokActive ? 'ACTIVO' : 'LOCAL'}
                        </span>
                        <button
                            onClick={toggleNgrok}
                            disabled={ngrokLoading}
                            style={{
                                background: ngrokActive ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                                border: `1px solid ${ngrokActive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                                borderRadius: '8px', padding: '5px 10px', cursor: 'pointer',
                                color: ngrokActive ? 'var(--error)' : 'var(--success)',
                                display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 700, transition: 'var(--transition)'
                            }}
                        >
                            {ngrokLoading ? <Loader size={12} className="animate-spin" /> : <><Power size={12} /> {ngrokActive ? 'STOP' : 'START'}</>}
                        </button>
                    </div>
                    {displayUrl ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <p style={{ fontSize: '10px', color: 'var(--success)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{displayUrl}</p>
                            <button onClick={copyUrl} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}>
                                {copied ? <Check size={12} /> : <Copy size={12} />}
                            </button>
                        </div>
                    ) : (
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{ngrokActive ? 'Obteniendo URL...' : 'Exposición pública desactivada'}</p>
                    )}
                </div>

                {/* Sesiones */}
                <div className="kpi-card">
                    <span className="kpi-label">Actividad Total</span>
                    <div className="flex-between">
                        <span className="kpi-value" style={{ fontSize: '28px' }}>{status?.totalRequests || 0}</span>
                        <BarChart2 size={22} style={{ opacity: 0.15 }} />
                    </div>
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}>requests procesados</p>
                </div>
            </div>

            {/* Fila 2: Métricas secundarias */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {/* Uptime */}
                <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={18} style={{ color: 'var(--accent)', opacity: 0.7 }} />
                    <div>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>Uptime</p>
                        <p style={{ fontSize: '13px', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{status?.uptime || '—'}</p>
                    </div>
                </div>

                {/* Modelos en VRAM */}
                <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Cpu size={18} style={{ color: 'var(--accent)', opacity: 0.7 }} />
                    <div>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>En VRAM</p>
                        <p style={{ fontSize: '13px', fontWeight: 700 }}>
                            {loadedModels?.length > 0 ? loadedModels[0].name : 'Ninguno'}
                        </p>
                    </div>
                </div>

                {/* Sesiones recientes */}
                <div style={{ padding: '14px 18px', background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Zap size={18} style={{ color: status?.recentLogs?.length > 0 ? 'var(--accent)' : 'var(--text-muted)', opacity: 0.7 }} />
                    <div>
                        <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '1px' }}>Sesiones</p>
                        <p style={{ fontSize: '13px', fontWeight: 700 }}>{status?.recentLogs?.length || 0} <span style={{ fontSize: '10px', opacity: 0.5 }}>/ 100</span></p>
                    </div>
                </div>
            </div>
        </div>
    );
};
