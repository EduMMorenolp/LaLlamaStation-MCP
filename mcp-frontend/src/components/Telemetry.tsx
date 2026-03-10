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
            </div >
        </div >
    );
};
