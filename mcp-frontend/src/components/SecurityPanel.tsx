import React from 'react';
import { ShieldX, Trash2, Zap } from 'lucide-react';

interface SecurityPanelProps {
    blacklistedIps: string[];
    onUnban: (ip: string) => void;
    onPanic: () => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ blacklistedIps, onUnban, onPanic }) => {
    return (
        <div className="card-glass p-6 animate-fade">
            <div className="flex-between mb-6">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <ShieldX size={20} style={{ color: 'var(--error)' }} />
                    Seguridad y Blacklist
                </h2>
                <button
                    onClick={onPanic}
                    className="btn btn-danger"
                    style={{ fontWeight: 800, padding: '0.5rem 1rem' }}
                >
                    <Zap size={18} />
                    PÁNICO
                </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <p className="kpi-label" style={{ fontSize: '0.65rem' }}>Terminales Bloqueadas</p>
                {blacklistedIps.length === 0 ? (
                    <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: 'var(--radius-md)', border: '1px dashed var(--border-light)' }}>
                        <p style={{ fontSize: '0.7rem', opacity: 0.3 }}>Perímetro Limpio</p>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {blacklistedIps.map(ip => (
                            <div key={ip} className="card-glass" style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.05)', borderColor: 'rgba(239, 68, 68, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--error)', fontWeight: 600 }}>{ip}</span>
                                <button
                                    onClick={() => onUnban(ip)}
                                    className="btn btn-secondary"
                                    style={{ padding: '4px 8px', borderRadius: '6px' }}
                                    title="Restablecer Acceso"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div style={{ marginTop: '2rem', padding: '1rem', background: 'rgba(245, 158, 11, 0.05)', border: '1px solid rgba(245, 158, 11, 0.1)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <Zap size={14} style={{ color: 'var(--warning)' }} />
                    <span style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--warning)', letterSpacing: '0.1em' }}>AUTO-PROTOCOLO</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.4 }}>
                    Bloqueo automático tras 5 intentos fallidos de autenticación.
                </p>
            </div>
        </div>
    );
};
