import React from 'react';
import { Activity, Database, Globe, HardDrive } from 'lucide-react';

interface TelemetryProps {
    status: any;
}

export const Telemetry: React.FC<TelemetryProps> = ({ status }) => {
    if (!status) return <div className="glass p-4 animate-pulse">Cargando telemetría...</div>;

    const { diskSpace, loadedModels, ngrokInfo } = status;
    const usedPercent = ((diskSpace.total - diskSpace.free) / diskSpace.total) * 100;
    const isLowSpace = (diskSpace.free / diskSpace.total) < 0.1;

    return (
        <>
            {isLowSpace && (
                <div className="bg-red-500/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-3 mb-6 animate-pulse">
                    <ShieldAlert className="text-red-400" size={20} />
                    <p className="text-sm font-bold text-red-200">
                        ¡ALERTA!: El espacio en disco es crítico ({diskSpace.free.toFixed(2)}GB restantes). Considera borrar modelos.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="glass p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/20 rounded-lg">
                            <HardDrive className="text-indigo-400" size={24} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">Almacenamiento</p>
                            <p className="text-xl font-bold">{diskSpace?.free?.toFixed(2)} / {diskSpace?.total?.toFixed(2)} GB</p>
                        </div>
                    </div>
                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                            className={`h-full transition-all duration-1000 ${isLowSpace ? 'bg-red-500' : 'bg-indigo-500'}`}
                            style={{ width: `${usedPercent}%` }}
                        />
                    </div>
                </div>

                <div className="glass p-4 flex items-center gap-4 text-left">
                    <div className="p-3 bg-emerald-500/20 rounded-lg">
                        <Activity className="text-emerald-400" size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">Modelos en VRAM</p>
                        <p className="text-xl font-bold">{loadedModels?.length || 0}</p>
                    </div>
                </div>

                <div className="glass p-4 flex items-center gap-4 col-span-1 md:col-span-2 text-left">
                    <div className="p-3 bg-amber-500/20 rounded-lg">
                        <Globe className="text-amber-400" size={24} />
                    </div>
                    <div className="overflow-hidden">
                        <p className="text-sm text-slate-400">URL Pública (Ngrok)</p>
                        <p className="text-md font-mono truncate">{ngrokInfo?.url || 'Desconectado'}</p>
                    </div>
                </div>
            </div>
        </>
    );
};
