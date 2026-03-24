import { Bot, Check, ChevronDown, Clock, Copy, Cpu, RefreshCw, Send, Settings2, Trash2, Zap } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";

interface Message {
	id: string;
	role: "user" | "assistant";
	content: string;
	model?: string;
	timestamp: number;
	latencyMs?: number;
	inputTokens?: number;
	outputTokens?: number;
	isError?: boolean;
}

interface ChatPlaygroundProps {
	models: any[];
	onSendMessage: (model: string, message: string, options: any) => Promise<any>;
}

function TypingDots() {
	return (
		<div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "4px 0" }}>
			{[0, 1, 2].map((i) => (
				<span
					key={i}
					style={{
						width: "6px",
						height: "6px",
						borderRadius: "50%",
						background: "var(--accent)",
						animation: `typing-dot 1.2s ease-in-out ${i * 0.2}s infinite`,
						display: "block",
					}}
				/>
			))}
		</div>
	);
}

function formatLatency(ms: number): string {
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
	return `${(ms / 60000).toFixed(1)}m`;
}

function CopyButton({ text }: { text: string }) {
	const [copied, setCopied] = useState(false);
	const handleCopy = () => {
		navigator.clipboard.writeText(text).then(() => {
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
		});
	};
	return (
		<button
			onClick={handleCopy}
			style={{
				background: "transparent",
				border: "none",
				cursor: "pointer",
				color: copied ? "var(--success)" : "var(--text-muted)",
				padding: "2px 4px",
				borderRadius: "4px",
				display: "flex",
				alignItems: "center",
				gap: "3px",
				fontSize: "10px",
				transition: "color 0.2s",
			}}
		>
			{copied ? <Check size={11} /> : <Copy size={11} />}
			{copied ? "Copiado" : "Copiar"}
		</button>
	);
}

const STORAGE_KEY = "llama-chat-playground";

interface PlaygroundState {
	history: Message[];
	selectedModel: string;
	temperature: number;
	numCtx: number;
	totalTokensSession: number;
	totalTimeSession: number;
}

export const ChatPlayground: React.FC<ChatPlaygroundProps> = ({ models, onSendMessage }) => {
	// Load persisted state from localStorage
	const loadPersistedState = (): Partial<PlaygroundState> => {
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			return stored ? JSON.parse(stored) : {};
		} catch {
			return {};
		}
	};

	const persistedState = loadPersistedState();
	const [selectedModel, setSelectedModel] = useState(persistedState.selectedModel || models[0]?.name || "");
	const [message, setMessage] = useState("");
	const [history, setHistory] = useState<Message[]>(persistedState.history || []);
	const [temperature, setTemperature] = useState(persistedState.temperature ?? 0.7);
	const [numCtx, setNumCtx] = useState(persistedState.numCtx ?? 4096);
	const [loading, setLoading] = useState(false);
	const [showSettings, setShowSettings] = useState(false);
	const [totalTokensSession, setTotalTokensSession] = useState(persistedState.totalTokensSession ?? 0);
	const [totalTimeSession, setTotalTimeSession] = useState(persistedState.totalTimeSession ?? 0);

	const messagesEndRef = useRef<HTMLDivElement>(null);
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// ─── PERSIST STATE TO LOCALSTORAGE ────────────────────────
	useEffect(() => {
		const state: PlaygroundState = {
			history,
			selectedModel,
			temperature,
			numCtx,
			totalTokensSession,
			totalTimeSession,
		};
		localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
	}, [history, selectedModel, temperature, numCtx, totalTokensSession, totalTimeSession]);

	// Sync selected model if models load after component
	useEffect(() => {
		if (!selectedModel && models.length > 0) setSelectedModel(models[0].name);
	}, [models, selectedModel]);

	// Auto-scroll
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	}, []);

	// Auto-resize textarea
	const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setMessage(e.target.value);
		const ta = textareaRef.current;
		if (ta) {
			ta.style.height = "auto";
			ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
		}
	};

	const handleSend = useCallback(async () => {
		if (!message.trim() || loading || !selectedModel) return;

		const id = Math.random().toString(36).slice(2);
		const userMsg: Message = {
			id,
			role: "user",
			content: message,
			timestamp: Date.now(),
		};

		setHistory((prev) => [...prev, userMsg]);
		setMessage("");
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}
		setLoading(true);

		const start = Date.now();
		try {
			const response = await onSendMessage(selectedModel, message, { temperature, num_ctx: numCtx });
			const latencyMs = Date.now() - start;
			const inputTok = response.prompt_eval_count || 0;
			const outputTok = response.eval_count || 0;

			const assistantMsg: Message = {
				id: Math.random().toString(36).slice(2),
				role: "assistant",
				content: response.content || response.message?.content || response.text || "",
				model: selectedModel,
				timestamp: Date.now(),
				latencyMs,
				inputTokens: inputTok,
				outputTokens: outputTok,
			};

			setHistory((prev) => [...prev, assistantMsg]);
			setTotalTokensSession((prev) => prev + inputTok + outputTok);
			setTotalTimeSession((prev) => prev + latencyMs);
		} catch (err: any) {
			setHistory((prev) => [
				...prev,
				{
					id: Math.random().toString(36).slice(2),
					role: "assistant",
					content: `Error: ${err.message || "Sin respuesta del servidor"}`,
					model: selectedModel,
					timestamp: Date.now(),
					latencyMs: Date.now() - start,
					isError: true,
				},
			]);
		} finally {
			setLoading(false);
		}
	}, [message, loading, selectedModel, temperature, numCtx, onSendMessage]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const clearChat = () => {
		setHistory([]);
		setTotalTokensSession(0);
		setTotalTimeSession(0);
		// Clear persisted state
		localStorage.removeItem(STORAGE_KEY);
	};

	const modelShortName = selectedModel.split(":")[0] || selectedModel;

	// Suggestions for empty state
	const suggestions = [
		"¿Qué puedes hacer?",
		"Explica la diferencia entre LLaMA y Mistral",
		"Escribe un script Python para leer un CSV",
		"Resume el concepto de cuantizacion de modelos",
	];

	return (
		<div
			style={{
				display: "flex",
				flexDirection: "column",
				height: "calc(100vh - 160px)",
				minHeight: "500px",
				gap: 0,
			}}
		>
			<style>{`
                @keyframes typing-dot {
                    0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
                    30% { transform: translateY(-6px); opacity: 1; }
                }
                .chat-msg-user { display: flex; justify-content: flex-end; padding: 6px 0; }
                .chat-msg-bot { display: flex; justify-content: flex-start; padding: 6px 0; }
                .bubble-user {
                    max-width: 72%; background: var(--accent);
                    color: white; padding: 12px 16px; border-radius: 18px 18px 4px 18px;
                    font-size: 14px; line-height: 1.6; word-break: break-word;
                    box-shadow: 0 4px 20px rgba(79,140,255,0.3);
                }
                .bubble-bot {
                    max-width: 80%; background: rgba(255,255,255,0.04);
                    border: 1px solid var(--border-light);
                    padding: 14px 16px; border-radius: 4px 18px 18px 18px;
                    font-size: 14px; line-height: 1.7; word-break: break-word;
                }
                .bubble-error { border-color: rgba(239,68,68,0.4); background: rgba(239,68,68,0.06); }
                .playground-textarea {
                    width: 100%; background: transparent; border: none; outline: none; resize: none;
                    color: var(--text-main); font-size: 14px; line-height: 1.6; font-family: inherit;
                    min-height: 24px; max-height: 160px; overflow-y: auto;
                }
                .playground-textarea::placeholder { color: var(--text-muted); }
                .msg-footer-bar { display: flex; align-items: center; gap: 12px; margin-top: 8px; padding-top: 6px; border-top: 1px solid rgba(255,255,255,0.05); flex-wrap: wrap; }
                .msg-meta { font-size: 10px; color: var(--text-muted); display: flex; align-items: center; gap: 3px; }
                .model-selector-dropdown {
                    background: rgba(255,255,255,0.04); border: 1px solid var(--border-light);
                    color: var(--text-main); border-radius: 8px; padding: 6px 10px 6px 12px;
                    font-size: 12px; font-weight: 700; cursor: pointer; outline: none;
                    appearance: none; min-width: 160px;
                }
            `}</style>

			{/* ── HEADER ────────────────────────────────────── */}
			<div
				style={{
					display: "flex",
					alignItems: "center",
					gap: "12px",
					padding: "14px 20px",
					background: "rgba(255,255,255,0.02)",
					borderBottom: "1px solid var(--border-light)",
					flexShrink: 0,
					borderRadius: "12px 12px 0 0",
				}}
			>
				{/* Avatar del modelo */}
				<div
					style={{
						width: "38px",
						height: "38px",
						borderRadius: "10px",
						flexShrink: 0,
						background: loading ? "rgba(79,140,255,0.15)" : "rgba(79,140,255,0.1)",
						border: `1px solid ${loading ? "var(--accent)" : "rgba(79,140,255,0.2)"}`,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						transition: "all 0.3s ease",
						boxShadow: loading ? "0 0 20px rgba(79,140,255,0.3)" : "none",
					}}
				>
					{loading ? (
						<RefreshCw size={18} style={{ color: "var(--accent)", animation: "spin 1s linear infinite" }} />
					) : (
						<Bot size={18} style={{ color: "var(--accent)" }} />
					)}
				</div>

				{/* Info del modelo */}
				<div style={{ flex: 1, minWidth: 0 }}>
					<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
						<h3
							style={{
								fontSize: "14px",
								fontWeight: 800,
								color: "var(--text-main)",
								whiteSpace: "nowrap",
								overflow: "hidden",
								textOverflow: "ellipsis",
							}}
						>
							{modelShortName || "Sin modelo"}
						</h3>
						<span
							style={{
								fontSize: "9px",
								padding: "2px 8px",
								borderRadius: "4px",
								fontWeight: 800,
								letterSpacing: "1px",
								background: loading ? "rgba(245,158,11,0.15)" : "rgba(16,185,129,0.1)",
								color: loading ? "#f59e0b" : "var(--success)",
								border: `1px solid ${loading ? "rgba(245,158,11,0.3)" : "rgba(16,185,129,0.2)"}`,
							}}
						>
							{loading ? "PROCESANDO..." : "LISTO"}
						</span>
					</div>
					<div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "2px" }}>
						{loading ? (
							<TypingDots />
						) : (
							<span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
								Inferencia via Ollama local
							</span>
						)}
					</div>
				</div>

				{/* Stats de sesion */}
				{totalTokensSession > 0 && (
					<div style={{ display: "flex", gap: "16px", flexShrink: 0 }}>
						<div style={{ textAlign: "center" }}>
							<p
								style={{
									fontSize: "13px",
									fontWeight: 800,
									color: "var(--accent)",
									fontFamily: "var(--font-mono)",
								}}
							>
								{totalTokensSession > 1000
									? `${(totalTokensSession / 1000).toFixed(1)}K`
									: totalTokensSession}
							</p>
							<p
								style={{
									fontSize: "9px",
									color: "var(--text-muted)",
									textTransform: "uppercase",
									letterSpacing: "1px",
								}}
							>
								tokens
							</p>
						</div>
						<div style={{ textAlign: "center" }}>
							<p
								style={{
									fontSize: "13px",
									fontWeight: 800,
									color: "var(--success)",
									fontFamily: "var(--font-mono)",
								}}
							>
								{formatLatency(totalTimeSession)}
							</p>
							<p
								style={{
									fontSize: "9px",
									color: "var(--text-muted)",
									textTransform: "uppercase",
									letterSpacing: "1px",
								}}
							>
								sesion
							</p>
						</div>
					</div>
				)}

				{/* Acciones */}
				<div style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
					{history.length > 0 && (
						<button
							className="btn-icon"
							onClick={clearChat}
							title="Limpiar chat"
							style={{ color: "var(--text-muted)" }}
						>
							<Trash2 size={16} />
						</button>
					)}
					<button
						className="btn-icon"
						onClick={() => setShowSettings(!showSettings)}
						style={{ color: showSettings ? "var(--accent)" : "var(--text-muted)" }}
						title="Configuracion"
					>
						<Settings2 size={18} />
					</button>
				</div>
			</div>

			{/* ── SETTINGS PANEL ────────────────────────────── */}
			{showSettings && (
				<div
					style={{
						padding: "16px 20px",
						background: "rgba(10,10,20,0.95)",
						borderBottom: "1px solid var(--border-light)",
						flexShrink: 0,
						display: "grid",
						gridTemplateColumns: "2fr 1fr 1fr",
						gap: "16px",
						alignItems: "end",
					}}
				>
					<div>
						<label
							style={{
								fontSize: "10px",
								color: "var(--text-muted)",
								display: "block",
								marginBottom: "6px",
								textTransform: "uppercase",
								letterSpacing: "1px",
							}}
						>
							<Cpu size={11} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
							Modelo Activo
						</label>
						<select
							value={selectedModel}
							onChange={(e) => setSelectedModel(e.target.value)}
							className="model-selector-dropdown"
							style={{ width: "100%" }}
						>
							{models.length === 0 ? (
								<option>Sin modelos instalados</option>
							) : (
								models.map((m) => (
									<option key={m.name} value={m.name}>
										{m.name}
									</option>
								))
							)}
						</select>
					</div>
					<div>
						<label
							style={{
								fontSize: "10px",
								color: "var(--text-muted)",
								display: "block",
								marginBottom: "6px",
								textTransform: "uppercase",
								letterSpacing: "1px",
							}}
						>
							<Zap size={11} style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }} />
							Temperatura ({temperature})
						</label>
						<input
							type="range"
							min={0}
							max={2}
							step={0.05}
							value={temperature}
							onChange={(e) => setTemperature(parseFloat(e.target.value))}
							style={{ width: "100%", accentColor: "var(--accent)", cursor: "pointer" }}
						/>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								fontSize: "9px",
								color: "var(--text-muted)",
								marginTop: "2px",
							}}
						>
							<span>Preciso</span>
							<span>Creativo</span>
						</div>
					</div>
					<div>
						<label
							style={{
								fontSize: "10px",
								color: "var(--text-muted)",
								display: "block",
								marginBottom: "6px",
								textTransform: "uppercase",
								letterSpacing: "1px",
							}}
						>
							<Clock
								size={11}
								style={{ display: "inline", marginRight: "4px", verticalAlign: "middle" }}
							/>
							Contexto ({numCtx >= 1000 ? `${(numCtx / 1024).toFixed(0)}K` : numCtx})
						</label>
						<select
							value={numCtx}
							onChange={(e) => setNumCtx(Number(e.target.value))}
							className="model-selector-dropdown"
							style={{ width: "100%" }}
						>
							{[2048, 4096, 8192, 16384, 32768, 65536].map((v) => (
								<option key={v} value={v}>
									{v >= 1024 ? `${v / 1024}K` : v} tokens
								</option>
							))}
						</select>
					</div>
				</div>
			)}

			{/* ── MESSAGES ──────────────────────────────────── */}
			<div
				style={{
					flex: 1,
					overflowY: "auto",
					padding: "20px",
					display: "flex",
					flexDirection: "column",
					gap: "4px",
				}}
			>
				{/* Empty state */}
				{history.length === 0 && !loading && (
					<div
						style={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							height: "100%",
							gap: "24px",
						}}
					>
						<div style={{ textAlign: "center", opacity: 0.15 }}>
							<div style={{ fontSize: "48px", marginBottom: "12px" }}>🦙</div>
							<p
								style={{
									fontSize: "13px",
									fontWeight: 700,
									letterSpacing: "2px",
									textTransform: "uppercase",
								}}
							>
								LaLlamaStation Playground
							</p>
							<p style={{ fontSize: "11px", marginTop: "4px", opacity: 0.7 }}>
								Inferencia local con Ollama
							</p>
						</div>
						<div
							style={{
								display: "grid",
								gridTemplateColumns: "1fr 1fr",
								gap: "8px",
								maxWidth: "520px",
								width: "100%",
							}}
						>
							{suggestions.map((s) => (
								<button
									key={s}
									onClick={() => setMessage(s)}
									style={{
										padding: "10px 14px",
										background: "rgba(255,255,255,0.03)",
										border: "1px solid var(--border-light)",
										borderRadius: "10px",
										cursor: "pointer",
										color: "var(--text-dim)",
										fontSize: "11px",
										textAlign: "left",
										lineHeight: "1.4",
										transition: "var(--transition)",
									}}
									onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--accent)")}
									onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-light)")}
								>
									{s}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Messages */}
				{history.map((msg) => (
					<div key={msg.id} className={msg.role === "user" ? "chat-msg-user" : "chat-msg-bot"}>
						<div
							className={`${msg.role === "user" ? "bubble-user" : `bubble-bot${msg.isError ? " bubble-error" : ""}`}`}
						>
							{/* Content */}
							{msg.role === "assistant" ? (
								<div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
							) : (
								<div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
							)}

							{/* Footer con metadatos */}
							<div className="msg-footer-bar">
								{/* Timestamp */}
								<span className="msg-meta">
									<Clock size={9} />
									{new Date(msg.timestamp).toLocaleTimeString([], {
										hour: "2-digit",
										minute: "2-digit",
										second: "2-digit",
									})}
								</span>

								{/* Latencia - solo en respuestas del bot */}
								{msg.role === "assistant" && msg.latencyMs && (
									<span
										className="msg-meta"
										style={{ color: msg.latencyMs > 10000 ? "#f59e0b" : "var(--text-muted)" }}
									>
										<Zap size={9} />
										{formatLatency(msg.latencyMs)}
									</span>
								)}

								{/* Tokens */}
								{msg.role === "assistant" && (msg.inputTokens || msg.outputTokens) ? (
									<span className="msg-meta">
										💎 {(msg.inputTokens || 0) + (msg.outputTokens || 0)} tokens
										<span style={{ opacity: 0.5, fontSize: "9px" }}>
											({msg.inputTokens}↓ {msg.outputTokens}↑)
										</span>
									</span>
								) : null}

								{/* Modelo */}
								{msg.role === "assistant" && msg.model && (
									<span className="msg-meta" style={{ color: "var(--accent)", opacity: 0.5 }}>
										<Cpu size={9} />
										{msg.model.split(":")[0]}
									</span>
								)}

								{/* Copy button - bot only */}
								{msg.role === "assistant" && (
									<span style={{ marginLeft: "auto" }}>
										<CopyButton text={msg.content} />
									</span>
								)}
							</div>
						</div>
					</div>
				))}

				{/* Typing indicator */}
				{loading && (
					<div className="chat-msg-bot">
						<div
							className="bubble-bot"
							style={{ padding: "14px 18px", display: "flex", alignItems: "center", gap: "12px" }}
						>
							<TypingDots />
							<span style={{ fontSize: "11px", color: "var(--text-muted)" }}>
								{selectedModel.split(":")[0]} esta procesando...
							</span>
						</div>
					</div>
				)}

				<div ref={messagesEndRef} />
			</div>

			{/* ── INPUT ─────────────────────────────────────── */}
			<div
				style={{
					padding: "12px 16px",
					flexShrink: 0,
					borderRadius: "0 0 12px 12px",
				}}
			>
				<div
					style={{
						display: "flex",
						alignItems: "center",
						gap: "10px",
						background: "rgba(255,255,255,0.04)",
						border: "1px solid var(--border-light)",
						borderRadius: "14px",
						padding: "10px 14px",
						transition: "border-color 0.2s",
					}}
					onFocus={() => {}}
				>
					<textarea
						ref={textareaRef}
						className="playground-textarea"
						placeholder={`Habla con ${modelShortName || "el modelo"}... (⏎ enviar, Shift+⏎ nueva linea)`}
						value={message}
						onChange={handleTextareaChange}
						onKeyDown={handleKeyDown}
						rows={1}
						disabled={loading || models.length === 0}
					/>
					<button
						onClick={handleSend}
						disabled={loading || !message.trim() || models.length === 0}
						style={{
							width: "36px",
							height: "36px",
							borderRadius: "10px",
							flexShrink: 0,
							background: !message.trim() || loading ? "rgba(255,255,255,0.06)" : "var(--accent)",
							border: "none",
							cursor: !message.trim() || loading ? "not-allowed" : "pointer",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							color: "white",
							transition: "all 0.2s ease",
							boxShadow: message.trim() && !loading ? "0 4px 16px rgba(79,140,255,0.4)" : "none",
						}}
					>
						{loading ? (
							<RefreshCw size={16} style={{ animation: "spin 1s linear infinite" }} />
						) : (
							<Send size={16} />
						)}
					</button>
				</div>

				{/* Model quick selector pill */}
				<div
					style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "8px", paddingLeft: "4px" }}
				>
					<span style={{ fontSize: "10px", color: "var(--text-muted)" }}>Modelo:</span>
					<div style={{ position: "relative", display: "flex", alignItems: "center" }}>
						<select
							value={selectedModel}
							onChange={(e) => setSelectedModel(e.target.value)}
							style={{
								background: "rgba(79,140,255,0.1)",
								border: "1px solid rgba(79,140,255,0.3)",
								borderRadius: "6px",
								color: "var(--accent)",
								fontSize: "11px",
								fontWeight: 700,
								padding: "3px 24px 3px 8px",
								cursor: "pointer",
								outline: "none",
								appearance: "none",
							}}
						>
							{models.length === 0 ? (
								<option>Sin modelos</option>
							) : (
								models.map((m) => (
									<option key={m.name} value={m.name}>
										{m.name}
									</option>
								))
							)}
						</select>
						<ChevronDown
							size={10}
							style={{
								position: "absolute",
								right: "6px",
								color: "var(--accent)",
								pointerEvents: "none",
							}}
						/>
					</div>
					<span style={{ fontSize: "10px", color: "var(--text-muted)", marginLeft: "auto" }}>
						⌨ Shift+Enter = nueva linea
					</span>
				</div>
			</div>
		</div>
	);
};
