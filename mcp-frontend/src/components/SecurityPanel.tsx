import React from 'react';
import { ShieldX, Trash2, Zap } from 'lucide-react';

interface SecurityPanelProps {
    blacklistedIps: string[];
    onUnban: (ip: string) => void;
    onPanic: () => void;
}

export const SecurityPanel: React.FC<SecurityPanelProps> = ({ blacklistedIps, onUnban, onPanic }) => {
    return (
        <div className="glass p-6">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <ShieldX size={20} className="text-red-400" />
                    Seguridad y Blacklist
                </h2>
                <button
                    onClick={onPanic}
                    className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded-lg flex items-center gap-2 font-bold transition-transform active:scale-95"
                >
                    <Zap size={18} />
                    BOTÓN DE PÁNICO
                </button>
            </div>

            <div className="space-y-4">
                <p className="text-sm text-slate-400">IPs Bloqueadas actualmente:</p>
                {blacklistedIps.length === 0 ? (
                    <p className="text-xs italic text-slate-500">No hay IPs en la lista negra.</p>
                ) : (
                    <div className="space-y-2">
                        {blacklistedIps.map(ip => (
                            <div key={ip} className="flex items-center justify-between bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
                                <span className="font-mono text-sm text-red-400">{ip}</span>
                                <button
                                    onClick={() => onUnban(ip)}
                                    className="text-slate-400 hover:text-white transition-colors"
                                    title="Desbloquear"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="mt-8 p-4 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                <p className="text-xs text-amber-500 font-semibold mb-1 uppercase tracking-wider">Estado del Escudo</p>
                <p className="text-sm text-slate-300">
                    El servidor está configurado para auto-banear cualquier IP con 5 intentos fallidos de API KEY.
                </p>
            </div>
        </div>
    );
};
