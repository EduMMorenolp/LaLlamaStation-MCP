import React from 'react';
import { Shield, XCircle } from 'lucide-react';

interface IpLogsProps {
    logs: any[];
    onBan: (ip: string) => void;
}

export const IpLogs: React.FC<IpLogsProps> = ({ logs, onBan }) => {
    return (
        <div className="card-glass p-6 h-full flex flex-col">
            <div className="flex-between mb-4">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Shield size={20} style={{ color: 'var(--primary)' }} />
                    Auditoría de Accesos Reales
                </h2>
                <span className="badge badge-success" style={{ padding: '0.4rem 1rem' }}>{logs?.length || 0} Sesiones</span>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 'var(--radius-md)', background: 'rgba(0,0,0,0.1)' }}>
                <table className="table-container">
                    <thead>
                        <tr>
                            <th>Dirección IP</th>
                            <th>Operación</th>
                            <th>Estado</th>
                            <th style={{ textAlign: 'right' }}>Control</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs?.length === 0 ? (
                            <tr>
                                <td colSpan={4} style={{ textAlign: 'center', opacity: 0.3, padding: '3rem' }}>
                                    Esperando nuevas conexiones...
                                </td>
                            </tr>
                        ) : logs?.map((log, i) => (
                            <tr key={i} className="animate-fade" style={{ animationDelay: `${i * 0.05}s` }}>
                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem' }}>{log.ip}</td>
                                <td style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{log.action || 'system_call'}</td>
                                <td>
                                    <span className={`badge ${log.status === 'Success' ? 'badge-success' : 'badge-error'}`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        onClick={() => onBan(log.ip)}
                                        className="btn btn-danger"
                                        style={{ padding: '4px 8px', borderRadius: '8px' }}
                                        title="Bloquear IP"
                                    >
                                        <XCircle size={14} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
