import React from 'react';
import { Shield, ShieldAlert, XCircle } from 'lucide-react';

interface IpLogsProps {
    logs: any[];
    onBan: (ip: string) => void;
}

export const IpLogs: React.FC<IpLogsProps> = ({ logs, onBan }) => {
    return (
        <div className="glass p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Shield size={20} className="text-indigo-400" />
                    Auditoría de Accesos
                </h2>
                <span className="badge badge-success">{logs?.length || 0} Registros</span>
            </div>

            <div className="flex-1 overflow-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-slate-700 text-slate-400 text-sm">
                            <th className="py-2">IP</th>
                            <th className="py-2">Acción</th>
                            <th className="py-2">Estado</th>
                            <th className="py-2 text-right">Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs?.map((log, i) => (
                            <tr key={i} className="border-b border-slate-800 hover:bg-slate-800/50 transition-colors">
                                <td className="py-3 font-mono text-xs">{log.ip}</td>
                                <td className="py-3 text-xs italic">{log.action || 'pull_model'}</td>
                                <td className="py-3">
                                    <span className={`badge ${log.status === 'Success' ? 'badge-success' : 'badge-danger'}`}>
                                        {log.status}
                                    </span>
                                </td>
                                <td className="py-3 text-right">
                                    <button
                                        onClick={() => onBan(log.ip)}
                                        className="p-1 text-slate-400 hover:text-red-400"
                                        title="Banear IP"
                                    >
                                        <XCircle size={16} />
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
