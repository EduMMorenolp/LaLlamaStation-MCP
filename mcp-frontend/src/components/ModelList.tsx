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
        <div className="card-glass p-6">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <Layers size={20} style={{ color: 'var(--primary)' }} />
                Repositorio de Modelos
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {pullProgress && (
                    <div className="card-glass" style={{ padding: '1rem', background: 'var(--primary-glow)', borderColor: 'var(--primary)', marginBottom: '1rem' }}>
                        <div className="flex-between" style={{ marginBottom: '0.5rem' }}>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800 }}>DESCARGANDO: {pullProgress.model}</span>
                            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--primary)' }}>{pullProgress.percent}%</span>
                        </div>
                        <div style={{ width: '100%', height: '4px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{ width: `${pullProgress.percent}%`, height: '100%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }} />
                        </div>
                    </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '350px', overflowY: 'auto', paddingRight: '0.5rem' }}>
                    {models?.length === 0 ? <p style={{ fontSize: '0.8rem', opacity: 0.3, textAlign: 'center', padding: '2rem' }}>No hay modelos instalados</p> :
                        models?.map(model => (
                            <div key={model.name} className="card-glass" style={{ padding: '1rem', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <div>
                                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>{model.name}</p>
                                    <div style={{ display: 'flex', gap: '1rem', marginTop: '4px' }}>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{model.details?.parameter_size || 'N/A'}</span>
                                        <span style={{ fontSize: '0.65rem', color: 'var(--primary)', fontWeight: 800 }}>
                                            {(model.size / Math.pow(1024, 3)).toFixed(2)} GB
                                        </span>
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem' }}>
                                    <Download
                                        size={16}
                                        style={{ cursor: 'pointer', opacity: 0.5 }}
                                        className="hover-text-primary transition-opacity"
                                        onClick={() => onPull(model.name)}
                                    />
                                    <Trash2
                                        size={16}
                                        style={{ cursor: 'pointer', opacity: 0.5 }}
                                        className="hover-text-error transition-opacity"
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
