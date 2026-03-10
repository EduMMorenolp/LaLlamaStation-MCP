import React from 'react';
import { Download, Layers, Trash2 } from 'lucide-react';

interface ModelListProps {
    models: any[];
    pullProgress: any;
    onPull: (name: string) => void;
    onDelete: (name: string) => void;
}

export const ModelList: React.FC<ModelListProps> = ({ models, pullProgress, onPull, onDelete }) => {
    return (
        <div className="glass p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Layers size={20} className="text-indigo-400" />
                Gestión de Modelos
            </h2>

            <div className="space-y-4">
                {/* Progress bar for active pull */}
                {pullProgress && (
                    <div className="bg-indigo-500/10 border border-indigo-500/30 p-4 rounded-lg mb-4">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-xs font-bold text-indigo-400 uppercase tracking-widest">
                                Descargando: {pullProgress.model}
                            </span>
                            <span className="text-xs font-bold text-indigo-400">{pullProgress.percent}%</span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                                className="bg-indigo-500 h-full transition-all duration-500"
                                style={{ width: `${pullProgress.percent}%` }}
                            />
                        </div>
                    </div>
                )}

                <div className="space-y-2 max-h-[300px] overflow-auto pr-2">
                    {models?.map(model => (
                        <div key={model.name} className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/50">
                            <div className="flex-1">
                                <p className="text-sm font-semibold">{model.name}</p>
                                <div className="flex gap-2">
                                    <p className="text-[10px] text-slate-500">{model.details?.parameter_size || 'N/A'}</p>
                                    <p className="text-[10px] text-indigo-400 font-bold">
                                        {(model.size / Math.pow(1024, 3)).toFixed(2)} GB
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <Download
                                    size={16}
                                    className="text-slate-500 cursor-pointer hover:text-indigo-400 transition-colors"
                                    onClick={() => onPull(model.name)}
                                />
                                <Trash2
                                    size={16}
                                    className="text-slate-500 cursor-pointer hover:text-red-400 transition-colors"
                                    onClick={() => onDelete(model.name)}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
