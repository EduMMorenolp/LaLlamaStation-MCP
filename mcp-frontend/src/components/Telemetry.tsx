import React from 'react';
import { Activity, Globe, HardDrive, ShieldAlert } from 'lucide-react';

interface TelemetryProps {
    status: any;
}

export const Telemetry: React.FC<TelemetryProps> = ({ status }) => {
    if (!status) return <div className="card-glass p-8 flex-center animate-pulse" style={{ color: 'var(--text-dim)' }}>Sincronizando telemetría en tiempo real...</div>;

    const { diskSpace, loadedModels, ngrokInfo } = status;
    const usedPercent = ((diskSpace.total - diskSpace.free) / diskSpace.total) * 100;
    const isLowSpace = (diskSpace.free / diskSpace.total) < 0.1;

    return (
        <div style={{ marginBottom: '2rem' }}>
            {isLowSpace && (
                <div className="badge-error animate-fade mb-6" style={{ padding: '1rem', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <ShieldAlert size={24} />
                    <div>
                        <p style={{ fontWeight: 800, fontSize: '0.9rem' }}>DISCO CRÍTICO</p>
                        <p style={{ fontSize: '0.8rem', opacity: 0.8 }}>Restan solo {diskSpace.free.toFixed(2)}GB. El sistema podría fallar al descargar nuevos modelos.</p>
                    </div>
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
                <div className="card-glass kpi-card">
                    <div className="flex-between">
                        <div className="kpi-label">Almacenamiento Local</div>
                        <HardDrive size={18} className="text-dim" style={{ color: isLowSpace ? 'var(--error)' : 'var(--primary)' }} />
                    </div>
                    <div className="kpi-value">
                        {diskSpace?.free?.toFixed(1)}<span style={{ fontSize: '0.8rem', opacity: 0.5 }}> / {diskSpace?.total?.toFixed(0)} GB</span>
                    </div>
                    <div style={{ width: '100%', height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', marginTop: '10px', overflow: 'hidden' }}>
                        <div style={{
                            width: `${usedPercent}%`,
                            height: '100%',
                            background: isLowSpace ? 'var(--error)' : 'var(--primary)',
                            boxShadow: `0 0 10px ${isLowSpace ? 'var(--error)' : 'var(--primary-glow)'}`
                        }} />
                    </div>
                </div>

                <div className="card-glass kpi-card">
                    <div className="flex-between">
                        <div className="kpi-label">Carga de VRAM</div>
                        <Activity size={18} style={{ color: 'var(--success)' }} />
                    </div>
                    <div className="kpi-value">
                        {loadedModels?.length || 0} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Modelos Activos</span>
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>GPU trabajando en estado óptimo</p>
                </div>

                <div className="card-glass kpi-card" style={{ gridColumn: 'span 2' }}>
                    <div className="flex-between">
                        <div className="kpi-label">Puerta de Enlace (NGROK)</div>
                        <Globe size={18} style={{ color: 'var(--warning)' }} />
                    </div>
                    <div className="kpi-value" style={{ fontSize: '1.2rem', fontFamily: 'var(--font-mono)', color: 'var(--warning)' }}>
                        {ngrokInfo?.url ? (
                            <a href={ngrokInfo.url} target="_blank" rel="noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                {ngrokInfo.url.replace('https://', '')}
                            </a>
                        ) : 'OFFLINE'}
                    </div>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Acceso remoto seguro habilitado vía túnel TLS</p>
                </div>
            </div>
        </div>
    );
};
