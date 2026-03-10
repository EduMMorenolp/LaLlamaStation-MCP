import React, { useState } from 'react';
import { Send, Settings, Terminal } from 'lucide-react';

interface ChatPlaygroundProps {
    models: any[];
    onSendMessage: (model: string, message: string, options: any) => Promise<any>;
}

export const ChatPlayground: React.FC<ChatPlaygroundProps> = ({ models, onSendMessage }) => {
    const [selectedModel, setSelectedModel] = useState(models[0]?.name || '');
    const [message, setMessage] = useState('');
    const [history, setHistory] = useState<any[]>([]);
    const [temperature, setTemperature] = useState(0.7);
    const [numCtx, setNumCtx] = useState(4096);
    const [sessionId, setSessionId] = useState(`session-${Date.now()}`);
    const [showRaw, setShowRaw] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!message.trim() || loading) return;

        const userMsg = { role: 'user', content: message };
        setHistory(prev => [...prev, userMsg]);
        setMessage('');
        setLoading(true);

        try {
            const response = await onSendMessage(selectedModel, message, {
                temperature,
                num_ctx: numCtx,
                session_id: sessionId
            });

            setHistory(prev => [...prev, response]);
        } catch (err: any) {
            setHistory(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, isError: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="card-glass p-6 animate-fade" style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
            <div className="flex-between mb-4">
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <Terminal size={20} style={{ color: 'var(--primary)' }} />
                    Playground de Inferencia
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button
                        onClick={() => setShowRaw(!showRaw)}
                        className={`btn ${showRaw ? 'btn-primary' : 'btn-secondary'}`}
                        style={{ padding: '4px 12px', fontSize: '0.6rem' }}
                    >
                        DEBUG JSON
                    </button>
                    <Settings size={18} style={{ color: 'var(--text-muted)', cursor: 'pointer' }} />
                </div>
            </div>

            <div className="grid-layout flex-1 overflow-hidden" style={{ gap: '1.5rem' }}>
                {/* Chat Area */}
                <div style={{ gridColumn: 'span 8', display: 'flex', flexDirection: 'column', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {history.length === 0 && (
                            <div className="flex-center" style={{ height: '100%', flexDirection: 'column', opacity: 0.3 }}>
                                <Terminal size={48} style={{ marginBottom: '1rem' }} />
                                <p style={{ fontSize: '0.8rem' }}>Sistema listo para comandos...</p>
                            </div>
                        )}
                        {history.map((msg, i) => (
                            <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                                <div className={`chat-msg ${msg.role === 'user' ? 'chat-msg-user' : 'chat-msg-bot'} ${msg.isError ? 'badge-error' : ''}`}>
                                    {showRaw ? (
                                        <pre style={{ fontSize: '10px', fontFamily: 'var(--font-mono)' }}>{JSON.stringify(msg, null, 2)}</pre>
                                    ) : (
                                        msg.content
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div style={{ padding: '1rem', background: 'rgba(0,0,0,0.2)', display: 'flex', gap: '1rem' }}>
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Prompt al motor Ollama..."
                            className="input-field"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            <Send size={18} className={loading ? 'animate-pulse' : ''} />
                        </button>
                    </div>
                </div>

                {/* Settings Area */}
                <div style={{ gridColumn: 'span 4', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <label className="kpi-label">Modelo Seleccionado</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="input-field"
                            style={{ fontSize: '0.8rem' }}
                        >
                            {models.map(m => (
                                <option key={m.name} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div className="flex-between">
                            <label className="kpi-label">Temperatura</label>
                            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{temperature}</span>
                        </div>
                        <input
                            type="range" min="0" max="2" step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            style={{ accentColor: 'var(--primary)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div className="flex-between">
                            <label className="kpi-label">Ventana de Contexto</label>
                            <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--primary)' }}>{numCtx}</span>
                        </div>
                        <input
                            type="range" min="512" max="32768" step="512"
                            value={numCtx}
                            onChange={(e) => setNumCtx(parseInt(e.target.value))}
                            style={{ accentColor: 'var(--primary)' }}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: 'auto' }}>
                        <label className="kpi-label">Master Session ID</label>
                        <input
                            type="text"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            className="input-field"
                            style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)' }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
