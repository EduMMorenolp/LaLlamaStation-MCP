import React, { useState } from 'react';
import { Send, Settings2, Terminal, RefreshCw, X } from 'lucide-react';

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
    const [loading, setLoading] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const handleSend = async () => {
        if (!message.trim() || loading) return;

        const userMsg = { role: 'user', content: message };
        setHistory(prev => [...prev, userMsg]);
        setMessage('');
        setLoading(true);

        try {
            const response = await onSendMessage(selectedModel, message, {
                temperature,
                num_ctx: numCtx
            });

            setHistory(prev => [...prev, response]);
        } catch (err: any) {
            setHistory(prev => [...prev, { role: 'assistant', content: `Error: ${err.message}`, isError: true }]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-full" style={{ height: '600px' }}>
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto chat-messages" style={{ paddingRight: '8px' }}>
                {history.length === 0 ? (
                    <div style={{ textAlign: 'center', opacity: 0.1, marginTop: '100px' }}>
                        <Terminal size={64} style={{ margin: '0 auto 24px' }} />
                        <p style={{ letterSpacing: '2px', fontWeight: 600 }}>SISTEMA DE INFERENCIA MCP</p>
                    </div>
                ) : (
                    history.map((msg, i) => (
                        <div key={i} className={`msg-row ${msg.role === 'user' ? 'user' : 'bot'}`}>
                            <div className="msg-bubble">
                                <p style={{ fontSize: '10px', fontWeight: 800, marginBottom: '8px', opacity: 0.5 }}>
                                    {msg.role?.toUpperCase()}
                                </p>
                                <div className="msg-content">
                                    {msg.content}
                                </div>
                            </div>
                        </div>
                    ))
                )}
                {loading && (
                    <div className="msg-row bot">
                        <div className="msg-bubble" style={{ opacity: 0.5 }}>
                            <RefreshCw size={16} className="animate-spin" />
                        </div>
                    </div>
                )}
            </div>

            {/* Settings Overlay */}
            {showSettings && (
                <div className="card-glass p-6 mb-4 animate-fade" style={{ background: 'var(--bg-sidebar)', border: '1px solid var(--border)' }}>
                    <div className="flex-between mb-6">
                        <span className="kpi-label">Configuración del Motor</span>
                        <X size={18} style={{ cursor: 'pointer', color: 'var(--text-muted)' }} onClick={() => setShowSettings(false)} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                        <div>
                            <label className="kpi-label" style={{ display: 'block', marginBottom: '8px' }}>Modelo Activo</label>
                            <select
                                value={selectedModel}
                                onChange={(e) => setSelectedModel(e.target.value)}
                                className="pin-input"
                                style={{ padding: '12px', fontSize: '14px', textAlign: 'left', letterSpacing: '0' }}
                            >
                                {models.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="kpi-label" style={{ display: 'block', marginBottom: '8px' }}>Temperatura ({temperature})</label>
                            <input
                                type="range" min="0" max="2" step="0.1"
                                value={temperature}
                                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--accent)' }}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Input Area */}
            <div className="chat-input-wrap">
                <div className="input-container">
                    <input
                        type="text"
                        placeholder="Enviar protocolo a Ollama..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        className="input-field"
                    />
                    <button onClick={handleSend} disabled={loading || !message.trim()} className="btn-send">
                        {loading ? <RefreshCw size={18} className="animate-spin" /> : <Send size={18} />}
                    </button>
                    <button className="btn-icon" onClick={() => setShowSettings(!showSettings)}>
                        <Settings2 size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};
