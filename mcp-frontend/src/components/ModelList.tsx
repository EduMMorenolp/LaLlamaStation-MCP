import React, { useState, useCallback } from 'react';
import axios from 'axios';
import { Download, Layers, Trash2, Search, PlusCircle, Info, Sparkles, RefreshCw, BookOpen, ExternalLink, Loader } from 'lucide-react';

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const HEADERS = () => ({ 'x-api-key': localStorage.getItem('llama_master_key') || '' });


interface ModelListProps {
    models: any[];
    pullProgress: any;
    onPull: (name: string) => void;
    onDelete: (name: string) => void;
}

const FALLBACK_MODELS = [
    { name: 'llama3.2', title: 'Llama 3.2', desc: 'El más balanceado para tareas diarias de Meta.', tags: ['3B', '11B'], pulls: '20M+' },
    { name: 'mistral', title: 'Mistral 7B', desc: 'Excelente para lógica, código y razonamiento.', tags: ['7B'], pulls: '15M+' },
    { name: 'phi4', title: 'Phi-4', desc: 'Modelo compacto y potente de Microsoft.', tags: ['14B'], pulls: '8M+' },
    { name: 'deepseek-r1', title: 'DeepSeek R1', desc: 'Razonamiento avanzado. Alternativa a o1.', tags: ['7B', '32B'], pulls: '5M+' },
    { name: 'codellama', title: 'Code Llama', desc: 'Especializado en generación de código.', tags: ['7B', '13B', '34B'], pulls: '10M+' },
    { name: 'gemma3', title: 'Gemma 3', desc: 'Modelo de Google para tareas generales.', tags: ['1B', '4B', '12B'], pulls: '6M+' },
    { name: 'qwen2.5', title: 'Qwen 2.5', desc: 'Multilingüe avanzado de Alibaba.', tags: ['7B', '14B', '32B'], pulls: '12M+' },
    { name: 'llava', title: 'LLaVA', desc: 'Visión + lenguaje. Analiza imágenes.', tags: ['7B', '13B'], pulls: '4M+' },
];

export const ModelList: React.FC<ModelListProps> = ({ models, pullProgress, onPull, onDelete }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState('');
    const [hasSearched, setHasSearched] = useState(false);

    const installedNames = models?.filter(m => !!m?.name).map(m => m.name as string) || [];

    const handleSearch = useCallback(async (term: string) => {
        if (!term.trim()) {
            setSearchResults([]);
            setHasSearched(false);
            return;
        }
        setIsSearching(true);
        setSearchError('');
        setHasSearched(true);
        try {
            const res = await axios.get(`${API}/api/search-models?q=${encodeURIComponent(term)}`, { headers: HEADERS() });
            setSearchResults(res.data.models || []);
        } catch {
            setSearchError('No se pudo conectar con ollama.com. Usa los modelos sugeridos abajo.');
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    }, []);

    const handleManualPull = () => {
        if (searchTerm.trim()) {
            // Si el término parece un nombre de modelo directo, descargarlo
            if (!searchTerm.includes(' ') && (searchTerm.includes(':') || searchTerm.includes('/') || !hasSearched)) {
                onPull(searchTerm.trim());
                setSearchTerm('');
            } else {
                handleSearch(searchTerm);
            }
        }
    };

    const displayModels = hasSearched ? searchResults : FALLBACK_MODELS;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>

            {/* ── Modelos Instalados ── PRIMERO ───────────────────── */}
            <div className="card-glass p-8 animate-fade">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '20px' }}>
                    <Layers size={22} style={{ color: 'var(--accent)' }} />
                    Modelos Instalados
                    <span style={{ marginLeft: 'auto', fontSize: '12px', fontWeight: 400, color: 'var(--text-muted)' }}>
                        {models?.filter(m => m?.name).length || 0} total
                    </span>
                </h2>

                {pullProgress && (
                    <div className="card-glass" style={{ padding: '16px', background: 'rgba(79,140,255,0.05)', border: '1px solid var(--accent)', marginBottom: '20px' }}>
                        <div className="flex-between" style={{ marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <RefreshCw size={14} className="animate-spin" style={{ color: 'var(--accent)' }} />
                                <span style={{ fontSize: '12px', fontWeight: 700 }}>DESCARGANDO: {pullProgress.model}</span>
                            </div>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: pullProgress.status === 'completed' ? 'var(--success)' : 'var(--accent)' }}>
                                {pullProgress.percent}%
                            </span>
                        </div>
                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.3)', borderRadius: '10px', overflow: 'hidden' }}>
                            <div style={{
                                width: `${pullProgress.percent}%`, height: '100%',
                                background: pullProgress.status === 'completed' ? 'var(--success)' : 'var(--accent)',
                                boxShadow: '0 0 15px var(--accent-glow)', transition: 'width 0.5s ease'
                            }} />
                        </div>
                        {pullProgress.status === 'completed' && (
                            <p style={{ fontSize: '11px', color: 'var(--success)', marginTop: '8px', fontWeight: 700 }}>
                                ✓ Descarga completa — actualizando lista...
                            </p>
                        )}
                    </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
                    {(models?.filter(m => !!m?.name) || []).length === 0 ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', opacity: 0.2, padding: '3rem' }}>
                            <Info size={40} style={{ margin: '0 auto 12px', display: 'block' }} />
                            <p style={{ fontSize: '13px' }}>Sin modelos instalados. Descarga uno desde "Descubrir Modelos" abajo.</p>
                        </div>
                    ) : (
                        models.filter(m => !!m?.name).map((model: any) => {
                            const sizeGb = model?.size > 0 ? (model.size / Math.pow(1024, 3)).toFixed(2) : null;
                            return (
                                <div key={model.name} className="card-glass" style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-main)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {model.name}
                                        </p>
                                        <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                                            {model.details?.parameter_size && (
                                                <span style={{ fontSize: '10px', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)', padding: '2px 6px', borderRadius: '4px' }}>
                                                    {model.details.parameter_size}
                                                </span>
                                            )}
                                            {sizeGb && (
                                                <span style={{ fontSize: '10px', color: 'var(--accent)', fontWeight: 700 }}>{sizeGb} GB</span>
                                            )}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                                        <button className="btn-icon" onClick={() => onPull(model.name)} title="Actualizar">
                                            <RefreshCw size={16} />
                                        </button>
                                        <button className="btn-icon" onClick={() => { if (confirm(`¿Eliminar ${model.name}?`)) onDelete(model.name); }} style={{ color: 'var(--error)' }} title="Eliminar">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>

            {/* ── Guía de Uso ─────────────────────────────────────── */}
            <div className="card-glass" style={{ padding: '20px', borderLeft: '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                    <BookOpen size={16} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '1px' }}>¿CÓMO AGREGAR MODELOS?</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', marginBottom: '6px', letterSpacing: '1px' }}>NOMBRE DIRECTO</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                            Escribe <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>llama3.2:3b</code> en el buscador y presiona <strong>＋</strong>.
                        </p>
                    </div>
                    <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <p style={{ fontSize: '10px', fontWeight: 800, color: 'var(--accent)', marginBottom: '6px', letterSpacing: '1px' }}>BÚSQUEDA EN LIBRERÍA</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.5' }}>
                            Escribe <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>vision</code> y presiona <strong>Enter</strong> para buscar en ollama.com.
                        </p>
                    </div>
                </div>
                <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '12px', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                    <ExternalLink size={11} /> Explorar Ollama Library completa →
                </a>
            </div>

            {/* ── Buscador / Descubrir ─────────────────────────────── */}
            <div className="card-glass" style={{ padding: '24px', borderLeft: '3px solid var(--accent)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                    <BookOpen size={18} style={{ color: 'var(--accent)' }} />
                    <h3 style={{ fontSize: '13px', fontWeight: 700, letterSpacing: '1px' }}>¿Cómo agregar modelos?</h3>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', marginBottom: '8px', letterSpacing: '1px' }}>OPCIÓN 1 — NOMBRE DIRECTO</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                            Escribe el nombre exacto del modelo en el buscador (ej: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>llama3.2:3b</code>) y presiona el botón <strong>＋</strong> para descargarlo directo.
                        </p>
                    </div>
                    <div style={{ padding: '16px', background: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                        <p style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent)', marginBottom: '8px', letterSpacing: '1px' }}>OPCIÓN 2 — BÚSQUEDA EN LIBRERÍA</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-dim)', lineHeight: '1.6' }}>
                            Escribe un término (ej: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-main)' }}>vision</code>) y presiona <strong>Enter</strong> para buscar en la librería oficial de Ollama en tiempo real.
                        </p>
                    </div>
                </div>
                <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: '14px', fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'none' }}>
                    <ExternalLink size={12} /> Explorar Ollama Library completa →
                </a>
            </div>

            {/* ── Buscador ────────────────────────────────────────── */}
            <div className="card-glass p-8 animate-fade">
                <div className="flex-between" style={{ marginBottom: '20px' }}>
                    <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Sparkles size={22} style={{ color: 'var(--accent)' }} />
                        Descubrir Modelos
                    </h2>
                    <span className="badge" style={{ background: 'rgba(79, 140, 255, 0.1)', color: 'var(--accent)', padding: '4px 12px', borderRadius: '6px', fontSize: '11px', fontWeight: 800 }}>
                        OLLAMA LIBRARY
                    </span>
                </div>

                <div className="model-search-bar">
                    <div style={{ position: 'relative', flex: 1 }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', opacity: 0.3 }} />
                        <input
                            type="text"
                            placeholder="Buscar en librería (Enter) o pegar nombre exacto con tag para descargar (ej: llama3.2:3b)..."
                            className="pin-input"
                            style={{ padding: '14px 14px 14px 48px', textAlign: 'left', fontSize: '13px', letterSpacing: '0' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleManualPull();
                            }}
                        />
                    </div>
                    <button
                        className="auth-btn"
                        style={{ width: 'auto', padding: '0 28px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={handleManualPull}
                        disabled={isSearching}
                    >
                        {isSearching ? <Loader size={18} className="animate-spin" /> : <PlusCircle size={18} />}
                    </button>
                </div>

                {searchError && (
                    <p style={{ fontSize: '12px', color: 'var(--warning)', marginBottom: '8px', padding: '8px 12px', background: 'rgba(245,158,11,0.08)', borderRadius: '6px', border: '1px solid rgba(245,158,11,0.2)' }}>
                        ⚠ {searchError}
                    </p>
                )}

                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '16px' }}>
                    {hasSearched
                        ? `${searchResults.length} resultado(s) para "${searchTerm}" — haz clic en una tarjeta para descargar`
                        : 'Modelos populares sugeridos — haz clic para descargar o usa el buscador arriba'
                    }
                </p>

                <div className="suggested-grid">
                    {isSearching ? (
                        <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '32px', opacity: 0.4 }}>
                            <Loader size={32} className="animate-spin" style={{ margin: '0 auto' }} />
                            <p style={{ marginTop: '12px', fontSize: '12px' }}>Consultando ollama.com...</p>
                        </div>
                    ) : displayModels.map((s: any) => {
                        const isInstalled = installedNames.some(n => n.startsWith(s.name.split(':')[0]));
                        return (
                            <div key={s.name} className="suggested-card" onClick={() => !isInstalled && onPull(s.name)}>
                                <div className="flex-between">
                                    <span className={`model-tag ${isInstalled ? '' : 'prime'}`}>
                                        {s.tags?.[0] || 'LLM'}
                                    </span>
                                    <span style={{ fontSize: '10px', opacity: 0.4 }}>{s.pulls || ''}</span>
                                </div>
                                <h3 style={{ fontSize: '14px', fontWeight: 700 }}>{s.title || s.name}</h3>
                                <p style={{ fontSize: '11px', color: 'var(--text-dim)', lineHeight: '1.4', flex: 1 }}>
                                    {s.desc || 'Modelo de la librería oficial de Ollama.'}
                                </p>
                                {s.tags?.length > 1 && (
                                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                                        {s.tags.slice(1).map((t: string) => (
                                            <span key={t} style={{ fontSize: '9px', padding: '1px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', color: 'var(--text-muted)' }}>{t}</span>
                                        ))}
                                    </div>
                                )}
                                {isInstalled ? (
                                    <span style={{ fontSize: '10px', color: 'var(--success)', fontWeight: 800, marginTop: '4px' }}>✓ INSTALADO</span>
                                ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent)', fontSize: '11px', fontWeight: 800, marginTop: '4px' }}>
                                        <Download size={12} /> DESCARGAR
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
