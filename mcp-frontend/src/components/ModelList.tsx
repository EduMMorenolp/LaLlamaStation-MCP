import React, { useState } from 'react';
import { Download, Layers, Trash2, Search, PlusCircle, Info, Sparkles, RefreshCw } from 'lucide-react';

interface ModelListProps {
    models: any[];
    pullProgress: any;
    onPull: (name: string) => void;
    onDelete: (name: string) => void;
}

const SUGGESTED_MODELS = [
    { name: 'llama3:8b', size: '4.7GB', type: 'General', desc: 'El más balanceado para tareas diarias.' },
    { name: 'mistral:latest', size: '4.1GB', type: 'Razonamiento', desc: 'Excelente para lógica y código.' },
    { name: 'phi3:latest', size: '2.3GB', type: 'Mini', desc: 'Ligero y potente de Microsoft.' },
    { name: 'codegemma:7b', size: '5.0GB', type: 'Coding', desc: 'Optimizado para desarrollo de software.' },
    { name: 'neural-chat', size: '4.1GB', type: 'Conversación', desc: 'Muy natural en sus respuestas.' },
    { name: 'deepseek-coder', size: '4.5GB', type: 'Coding', desc: 'Especialista en lenguajes complejos.' }
];

export const ModelList: React.FC<ModelListProps> = ({ models, pullProgress, onPull, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const installedNames = models?.map(m => m.name) || [];

    const handleManualPull = () => {
        if (searchTerm.trim()) {
            onPull(searchTerm.trim());
            setSearchTerm('');
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Discovery Section */}
            <div className="card-glass p-8 animate-fade">
                <div className="flex-between mb-8">
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Sparkles size={22} style={{ color: 'var(--accent)' }} />
                        Descubrir Modelos
                    </h2>
                    <span className="badge" style={{ background: 'rgba(79, 140, 255, 0.1)', color: 'var(--accent)' }}>Ollama Library</span>
                </div>

                <div className="model-search-bar">
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                        <input
                            type="text"
                            placeholder="Buscar modelo en la librería (ej: llama3, mistral, deepseek)..."
                            className="pin-input"
                            style={{ padding: '16px 16px 16px 48px', textAlign: 'left', fontSize: '14px', letterSpacing: '0' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleManualPull()}
                        />
                    </div>
                    <button className="auth-btn" style={{ width: 'auto', padding: '0 32px' }} onClick={handleManualPull}>
                        <PlusCircle size={20} />
                    </button>
                </div>

                <div className="suggested-grid">
                    {SUGGESTED_MODELS.map(s => {
                        const isInstalled = installedNames.some(name => name.startsWith(s.name.split(':')[0]));
                        return (
                            <div key={s.name} className="suggested-card" onClick={() => !isInstalled && onPull(s.name)}>
                                <div className="flex-between">
                                    <span className={`model-tag ${isInstalled ? '' : 'prime'}`}>{s.type}</span>
                                    <span style={{ fontSize: '10px', opacity: 0.5 }}>{s.size}</span>
                                </div>
                                <h3 style={{ fontSize: '14px', fontWeight: 700 }}>{s.name}</h3>
                                <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4' }}>{s.desc}</p>
                                {isInstalled ? (
                                    <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 800, marginTop: 'auto' }}>INSTALADO</span>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto', color: 'var(--accent)', fontSize: '11px', fontWeight: 800 }}>
                                        <Download size={12} /> DESCARGAR
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Installed Models Section */}
            <div className="card-glass p-8 animate-fade">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                    <Layers size={22} style={{ color: 'var(--primary)' }} />
                    Modelos Instalados
                </h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {pullProgress && (
                        <div className="card-glass" style={{ padding: '1.5rem', background: 'var(--primary-glow)', borderColor: 'var(--primary)', marginBottom: '1.5rem' }}>
                            <div className="flex-between" style={{ marginBottom: '1rem' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <RefreshCw size={16} className="animate-spin" />
                                    <span style={{ fontSize: '12px', fontWeight: 800 }}>SINCRONIZANDO: {pullProgress.model}</span>
                                </div>
                                <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)' }}>{pullProgress.percent}%</span>
                            </div>
                            <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                                <div style={{ width: `${pullProgress.percent}%`, height: '100%', background: 'var(--primary)', boxShadow: '0 0 15px var(--primary)' }} />
                            </div>
                        </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                        {models?.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', opacity: 0.3, padding: '4rem' }}>
                                <Info size={48} style={{ margin: '0 auto 16px' }} />
                                <p>No se han detectado modelos en el perímetro local.</p>
                            </div>
                        ) : (
                            models?.map(model => (
                                <div key={model.name} className="card-glass" style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div>
                                        <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-main)' }}>{model.name}</p>
                                        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                                            <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px' }}>
                                                {model.details?.parameter_size || 'N/A'}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--primary)', fontWeight: 800 }}>
                                                {(model.size / Math.pow(1024, 3)).toFixed(2)} GB
                                            </span>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '12px' }}>
                                        <button className="btn-icon" onClick={() => onPull(model.name)} title="Actualizar">
                                            <RefreshCw size={18} />
                                        </button>
                                        <button className="btn-icon" onClick={() => onDelete(model.name)} style={{ color: 'var(--error)' }} title="Eliminar">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
