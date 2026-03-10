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
        <div className="glass p-6 h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                    <Terminal size={20} className="text-indigo-400" />
                    Playground Avanzado
                </h2>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setShowRaw(!showRaw)}
                        className={`text-xs px-2 py-1 rounded transition-colors ${showRaw ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-slate-400'}`}
                    >
                        RAW JSON
                    </button>
                    <Settings size={18} className="text-slate-400 cursor-pointer hover:text-white" />
                </div>
            </div>

            <div className="grid grid-cols-12 gap-4 flex-1 overflow-hidden">
                {/* Chat Area */}
                <div className="col-span-12 md:col-span-8 flex flex-col bg-slate-900/50 rounded-xl border border-slate-800 overflow-hidden">
                    <div className="flex-1 overflow-auto p-4 space-y-4">
                        {history.map((msg, i) => (
                            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-tr-none' : 'bg-slate-800 text-slate-200 rounded-tl-none'
                                    } ${msg.isError ? 'border border-red-500/50 text-red-200' : ''}`}>
                                    {showRaw ? <pre className="text-[10px] overflow-auto">{JSON.stringify(msg, null, 2)}</pre> : msg.content}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="p-4 border-t border-slate-800 flex gap-2">
                        <input
                            type="text"
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Escribe un mensaje..."
                            className="flex-1 bg-slate-800 border-none rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        />
                        <button
                            onClick={handleSend}
                            disabled={loading}
                            className="bg-indigo-500 p-2 rounded-lg hover:bg-indigo-600 disabled:opacity-50"
                        >
                            <Send size={18} />
                        </button>
                    </div>
                </div>

                {/* Settings Area */}
                <div className="hidden md:block md:col-span-4 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">Modelo</label>
                        <select
                            value={selectedModel}
                            onChange={(e) => setSelectedModel(e.target.value)}
                            className="w-full bg-slate-800 border-none rounded-lg p-2 text-sm outline-none"
                        >
                            {models.map(m => (
                                <option key={m.name} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-bold text-slate-400 uppercase">Temperatura</label>
                            <span className="text-xs font-mono text-indigo-400">{temperature}</span>
                        </div>
                        <input
                            type="range" min="0" max="2" step="0.1"
                            value={temperature}
                            onChange={(e) => setTemperature(parseFloat(e.target.value))}
                            className="w-full accent-indigo-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between">
                            <label className="text-xs font-bold text-slate-400 uppercase">Contexto</label>
                            <span className="text-xs font-mono text-indigo-400">{numCtx}</span>
                        </div>
                        <input
                            type="range" min="512" max="32768" step="512"
                            value={numCtx}
                            onChange={(e) => setNumCtx(parseInt(e.target.value))}
                            className="w-full accent-indigo-500"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400 uppercase">ID de Sesión (Caché)</label>
                        <input
                            type="text"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            className="w-full bg-slate-800 border-none rounded-lg p-2 text-xs font-mono outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
