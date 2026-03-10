import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Activity, Globe, Database, Shield, Power, Loader, Copy, Check } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const HEADERS = () => ({ 'x-api-key': localStorage.getItem('symbiosis_key') || '' });

interface TelemetryProps {
    status: any;
}

export const Telemetry: React.FC<TelemetryProps> = ({ status }) => {
    const [ngrokLoading, setNgrokLoading] = useState(false);
    const [ngrokRunning, setNgrokRunning] = useState<boolean | null>(null);
    const [ngrokUrl, setNgrokUrl] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Estado real de ngrok del server si está disponible
    const ngrokActive = ngrokRunning ?? (status?.ngrokInfo?.active === true);
    const displayUrl = ngrokUrl ?? status?.ngrokInfo?.url ?? null;

    const toggleNgrok = useCallback(async () => {
        setNgrokLoading(true);
        try {
            const endpoint = ngrokActive ? '/api/ngrok/stop' : '/api/ngrok/start';
            const res = await axios.post(`${API}${endpoint}`, {}, { headers: HEADERS() });
            setNgrokRunning(res.data.running);
            if (res.data.running) {
                // Esperar un poco y obtener la URL del tunnel
                setTimeout(async () => {
                    try {
                        const statusRes = await axios.get(`${API}/api/ngrok/status`, { headers: HEADERS() });
                        setNgrokUrl(statusRes.data.url);
                    } catch { /* tunnel aún iniciando */ }
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

    const { diskSpace } = status;
    const freeSpace = diskSpace?.free || 0;
    const totalSpace = diskSpace?.total || 1;
    const usedPercent = ((totalSpace - freeSpace) / totalSpace) * 100;
    const isLowSpace = (freeSpace / totalSpace) < 0.1;

    return (
        <div className="kpi-grid animate-fade">
            {/* Estado Motor */}
            <div className="kpi-card">
                <span className="kpi-label">Estado del Motor</span>
                <div className="flex-between">
                    <span className="kpi-value" style={{ color: status?.ollamaRunning ? 'var(--success)' : 'var(--error)' }}>
                        {status?.ollamaRunning ? 'ONLINE' : 'OFFLINE'}
                    </span>
                    <Activity size={24} style={{ opacity: 0.2 }} />
                </div>
            </div>

            {/* Almacenamiento */}
            <div className="kpi-card">
                <span className="kpi-label">Almacenamiento Local</span>
                <div className="flex-between">
                    <span className="kpi-value">{freeSpace.toFixed(1)} <span style={{ fontSize: '12px', opacity: 0.5 }}>GB libres</span></span>
                    <Database size={24} style={{ opacity: 0.2 }} />
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${usedPercent}%`, height: '100%',
                        background: isLowSpace ? 'var(--error)' : 'var(--accent)',
                        boxShadow: `0 0 10px ${isLowSpace ? 'var(--error)' : 'var(--accent-glow)'}`
                    }} />
                </div>
            </div>

            {/* Ngrok — con control toggle */}
            <div className="kpi-card" style={{ borderColor: ngrokActive ? 'rgba(16,185,129,0.3)' : undefined }}>
                <span className="kpi-label">Túnel Ngrok</span>
                <div className="flex-between" style={{ marginBottom: '8px' }}>
                    <span className="kpi-value" style={{ fontSize: '14px', fontFamily: 'var(--font-mono)', color: ngrokActive ? 'var(--success)' : 'var(--text-dim)' }}>
                        {ngrokActive ? 'TUNNEL_ACTIVE' : 'LOCAL_ONLY'}
                    </span>
                    <button
                        onClick={toggleNgrok}
                        disabled={ngrokLoading}
                        title={ngrokActive ? 'Detener ngrok' : 'Iniciar ngrok'}
                        style={{
                            background: ngrokActive ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.15)',
                            border: `1px solid ${ngrokActive ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                            borderRadius: '8px', padding: '6px 10px', cursor: 'pointer',
                            color: ngrokActive ? 'var(--error)' : 'var(--success)',
                            display: 'flex', alignItems: 'center', gap: '4px',
                            fontSize: '11px', fontWeight: 700, transition: 'var(--transition)'
                        }}
                    >
                        {ngrokLoading
                            ? <Loader size={14} className="animate-spin" />
                            : <><Power size={12} /> {ngrokActive ? 'STOP' : 'START'}</>
                        }
                    </button>
                </div>
                {displayUrl ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <p style={{ fontSize: '10px', color: 'var(--success)', fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>
                            {displayUrl}
                        </p>
                        <button onClick={copyUrl} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: copied ? 'var(--success)' : 'var(--text-muted)', flexShrink: 0 }}>
                            {copied ? <Check size={12} /> : <Copy size={12} />}
                        </button>
                    </div>
                ) : (
                    <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>
                        {ngrokActive ? 'Obteniendo URL del túnel...' : 'Activa para exponer el servidor públicamente'}
                    </p>
                )}
            </div>

            {/* Sesiones */}
            <div className="kpi-card">
                <span className="kpi-label">Sesiones Activas</span>
                <div className="flex-between">
                    <span className="kpi-value">{status?.recentLogs?.length || 0}</span>
                    <Shield size={24} style={{ opacity: 0.2 }} />
                </div>
            </div>
        </div>
    );
};
