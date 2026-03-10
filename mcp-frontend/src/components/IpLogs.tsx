import React, { useState } from 'react';
import { Shield, XCircle, Search, Activity, Filter } from 'lucide-react';

interface IpLogsProps {
    logs: any[];
    onBan: (ip: string) => void;
}

export const IpLogs: React.FC<IpLogsProps> = ({ logs, onBan }) => {
    const [search, setSearch] = useState('');
    const [filter, setFilter] = useState<'all' | 'success' | 'fail'>('all');

    const filtered = (logs || []).filter(log => {
        const matchSearch = !search || log.ip?.includes(search) || log.action?.includes(search);
        const matchFilter =
            filter === 'all' ||
            (filter === 'success' && log.status === 'Success') ||
            (filter === 'fail' && log.status !== 'Success');
        return matchSearch && matchFilter;
    });

    const successCount = (logs || []).filter(l => l.status === 'Success').length;
    const failCount = (logs || []).length - successCount;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Stats Row */}
            <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className="kpi-card">
                    <span className="kpi-label">Total Sesiones</span>
                    <div className="flex-between">
                        <span className="kpi-value">{logs?.length || 0}</span>
                        <Activity size={24} style={{ opacity: 0.15 }} />
                    </div>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Accesos Exitosos</span>
                    <div className="flex-between">
                        <span className="kpi-value" style={{ color: 'var(--success)' }}>{successCount}</span>
                        <Shield size={24} style={{ opacity: 0.15, color: 'var(--success)' }} />
                    </div>
                </div>
                <div className="kpi-card">
                    <span className="kpi-label">Intentos Fallidos</span>
                    <div className="flex-between">
                        <span className="kpi-value" style={{ color: failCount > 0 ? 'var(--error)' : 'var(--text-dim)' }}>{failCount}</span>
                        <XCircle size={24} style={{ opacity: 0.15, color: 'var(--error)' }} />
                    </div>
                </div>
            </div>

            {/* Logs Panel */}
            <div className="card-glass p-6 animate-fade">
                <div className="flex-between mb-6">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Shield size={20} style={{ color: 'var(--accent)' }} />
                        Auditoría de Accesos
                    </h2>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {(['all', 'success', 'fail'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                style={{
                                    padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, cursor: 'pointer',
                                    background: filter === f ? 'var(--accent)' : 'transparent',
                                    color: filter === f ? 'white' : 'var(--text-muted)',
                                    border: `1px solid ${filter === f ? 'var(--accent)' : 'var(--border)'}`,
                                    transition: 'var(--transition)'
                                }}
                            >
                                {f === 'all' ? 'TODOS' : f === 'success' ? 'OK' : 'ERROR'}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ position: 'relative', marginBottom: '16px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                    <input
                        type="text"
                        placeholder="Filtrar por IP o acción..."
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)',
                            borderRadius: 'var(--radius-md)', padding: '10px 14px 10px 40px',
                            color: 'var(--text-main)', fontSize: '13px', outline: 'none'
                        }}
                    />
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    {filtered.length === 0 ? (
                        <div style={{ textAlign: 'center', opacity: 0.3, padding: '3rem' }}>
                            Esperando nuevas conexiones al perímetro...
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {filtered.map((log, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '16px',
                                    padding: '12px 16px',
                                    background: log.status === 'Success'
                                        ? 'rgba(16, 185, 129, 0.03)'
                                        : 'rgba(239, 68, 68, 0.05)',
                                    border: `1px solid ${log.status === 'Success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)'}`,
                                    borderRadius: 'var(--radius-md)',
                                    transition: 'var(--transition)'
                                }}>
                                    <div style={{
                                        width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
                                        background: log.status === 'Success' ? 'var(--success)' : 'var(--error)',
                                        boxShadow: `0 0 8px ${log.status === 'Success' ? 'var(--success)' : 'var(--error)'}`
                                    }} />
                                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent)', minWidth: '140px' }}>
                                        {log.ip}
                                    </span>
                                    <span style={{ fontSize: '12px', color: 'var(--text-dim)', flex: 1 }}>
                                        {log.action || 'system_call'}
                                    </span>
                                    <span style={{
                                        fontSize: '10px', fontWeight: 800, padding: '2px 8px', borderRadius: '4px',
                                        background: log.status === 'Success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)',
                                        color: log.status === 'Success' ? 'var(--success)' : 'var(--error)'
                                    }}>
                                        {log.status}
                                    </span>
                                    <button
                                        onClick={() => onBan(log.ip)}
                                        style={{
                                            background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239,68,68,0.2)',
                                            borderRadius: '6px', padding: '4px 10px', color: 'var(--error)',
                                            cursor: 'pointer', fontSize: '11px', fontWeight: 700,
                                            display: 'flex', alignItems: 'center', gap: '4px',
                                            transition: 'var(--transition)'
                                        }}
                                        title="Bloquear IP"
                                    >
                                        <XCircle size={12} /> BAN
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
