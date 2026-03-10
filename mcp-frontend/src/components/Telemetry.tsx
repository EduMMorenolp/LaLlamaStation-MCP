import React from 'react';
import { Activity, Globe, Database, Shield } from 'lucide-react';

interface TelemetryProps {
    status: any;
}

export const Telemetry: React.FC<TelemetryProps> = ({ status }) => {
    if (!status) return <div className="card-glass p-8 flex-center animate-pulse" style={{ color: 'var(--text-dim)' }}>Sincronizando telemetría en tiempo real...</div>;

    const { diskSpace, ngrokInfo } = status;
    const freeSpace = diskSpace?.free || 0;
    const totalSpace = diskSpace?.total || 1;
    const usedPercent = ((totalSpace - freeSpace) / totalSpace) * 100;
    const isLowSpace = (freeSpace / totalSpace) < 0.1;

    return (
        <div className="kpi-grid animate-fade">
            <div className="kpi-card">
                <span className="kpi-label">Estado del Motor</span>
                <div className="flex-between">
                    <span className="kpi-value" style={{ color: status?.ollamaRunning ? 'var(--success)' : 'var(--error)' }}>
                        {status?.ollamaRunning ? 'ONLINE' : 'OFFLINE'}
                    </span>
                    <Activity size={24} style={{ opacity: 0.2 }} />
                </div>
            </div>

            <div className="kpi-card">
                <span className="kpi-label">Almacenamiento Local</span>
                <div className="flex-between">
                    <span className="kpi-value">{freeSpace.toFixed(1)} <span style={{ fontSize: '12px', opacity: 0.5 }}>GB libres</span></span>
                    <Database size={24} style={{ opacity: 0.2 }} />
                </div>
                <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '8px', overflow: 'hidden' }}>
                    <div style={{
                        width: `${usedPercent}%`,
                        height: '100%',
                        background: isLowSpace ? 'var(--error)' : 'var(--accent)',
                        boxShadow: `0 0 10px ${isLowSpace ? 'var(--error)' : 'var(--accent-glow)'}`
                    }} />
                </div>
            </div>

            <div className="kpi-card">
                <span className="kpi-label">Tráfico Ngrok</span>
                <div className="flex-between">
                    <span className="kpi-value" style={{ fontSize: '14px', fontFamily: 'var(--font-mono)' }}>
                        {ngrokInfo?.url ? 'TUNNEL_ACTIVE' : 'LOCAL_ONLY'}
                    </span>
                    <Globe size={24} style={{ opacity: 0.2 }} />
                </div>
                <p style={{ fontSize: '10px', marginTop: '8px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {ngrokInfo?.url || 'No hay tunel activo'}
                </p>
            </div>

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
