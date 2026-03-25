import {
	BookOpen,
	Download,
	ExternalLink,
	Info,
	Layers,
	Loader,
	PlusCircle,
	RefreshCw,
	Search,
	Sparkles,
	Trash2,
} from "lucide-react";
import type React from "react";
import { useCallback, useState } from "react";
import { api } from "../services/api.service";

interface ModelListProps {
	models: any[];
	pullProgress: any;
	onPull: (name: string) => void;
	onDelete: (name: string) => void;
}

const FALLBACK_MODELS = [
	{
		name: "llama3.2",
		title: "Llama 3.2",
		desc: "El más balanceado para tareas diarias de Meta.",
		tags: ["3B", "11B"],
		pulls: "20M+",
	},
	{
		name: "mistral",
		title: "Mistral 7B",
		desc: "Excelente para lógica, código y razonamiento.",
		tags: ["7B"],
		pulls: "15M+",
	},
	{ name: "phi4", title: "Phi-4", desc: "Modelo compacto y potente de Microsoft.", tags: ["14B"], pulls: "8M+" },
	{
		name: "deepseek-r1",
		title: "DeepSeek R1",
		desc: "Razonamiento avanzado. Alternativa a o1.",
		tags: ["7B", "32B"],
		pulls: "5M+",
	},
	{
		name: "codellama",
		title: "Code Llama",
		desc: "Especializado en generación de código.",
		tags: ["7B", "13B", "34B"],
		pulls: "10M+",
	},
	{
		name: "gemma3",
		title: "Gemma 3",
		desc: "Modelo de Google para tareas generales.",
		tags: ["1B", "4B", "12B"],
		pulls: "6M+",
	},
	{
		name: "qwen2.5",
		title: "Qwen 2.5",
		desc: "Multilingüe avanzado de Alibaba.",
		tags: ["7B", "14B", "32B"],
		pulls: "12M+",
	},
	{ name: "llava", title: "LLaVA", desc: "Visión + lenguaje. Analiza imágenes.", tags: ["7B", "13B"], pulls: "4M+" },
];

export const ModelList: React.FC<ModelListProps> = ({ models, pullProgress, onPull, onDelete }) => {
	const [searchTerm, setSearchTerm] = useState("");
	const [searchResults, setSearchResults] = useState<any[]>([]);
	const [isSearching, setIsSearching] = useState(false);
	const [searchError, setSearchError] = useState("");
	const [hasSearched, setHasSearched] = useState(false);
	const [verificationModel, setVerificationModel] = useState<any | null>(null);

	const installedNames = models?.filter((m) => !!m?.name).map((m) => m.name as string) || [];

	const handleSearch = useCallback(async (term: string) => {
		if (!term.trim()) {
			setSearchResults([]);
			setHasSearched(false);
			return;
		}
		setIsSearching(true);
		setSearchError("");
		setHasSearched(true);
		try {
			const res = await api.get(`/api/search-models?q=${encodeURIComponent(term)}`);
			setSearchResults(res.data.models || []);
		} catch {
			setSearchError("No se pudo conectar con ollama.com. Usa los modelos sugeridos abajo.");
			setSearchResults([]);
		} finally {
			setIsSearching(false);
		}
	}, []);

	const handleManualPull = () => {
		if (searchTerm.trim()) {
			// Si el término parece un nombre de modelo directo, mostrar modal de verificación
			if (!searchTerm.includes(" ") && (searchTerm.includes(":") || searchTerm.includes("/") || !hasSearched)) {
				setVerificationModel({
					name: searchTerm.trim(),
					title: searchTerm.trim(),
					desc: "Modelo ingresado manualmente. Verifica el nombre antes de continuar.",
				});
			} else {
				handleSearch(searchTerm);
			}
		}
	};

	const confirmPull = () => {
		if (verificationModel) {
			onPull(verificationModel.name);
			setVerificationModel(null);
			setSearchTerm("");
		}
	};

	const displayModels = hasSearched ? searchResults : FALLBACK_MODELS;

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
			{/* ── Modelos Instalados ── PRIMERO ───────────────────── */}
			<div className="card-glass p-8 animate-fade">
				<h2 style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "20px" }}>
					<Layers size={22} style={{ color: "var(--accent)" }} />
					Modelos Instalados
					<span style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 400, color: "var(--text-muted)" }}>
						{models?.filter((m) => m?.name).length || 0} total
					</span>
				</h2>

				{pullProgress && (
					<div
						className="card-glass"
						style={{
							padding: "24px",
							background: "rgba(79,140,255,0.05)",
							border: "1px solid var(--accent)",
							marginBottom: "32px",
							boxShadow: "0 0 40px rgba(79, 140, 255, 0.1)",
							position: "relative",
							overflow: "hidden",
						}}
					>
						<div className="flex-between" style={{ marginBottom: "16px" }}>
							<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
								<RefreshCw size={18} className="animate-spin" style={{ color: "var(--accent)" }} />
								<div>
									<span
										style={{
											fontSize: "14px",
											fontWeight: 800,
											display: "block",
											color: "var(--accent)",
										}}
									>
										DESCARGANDO MOTOR DIGITAL
									</span>
									<span
										style={{
											fontSize: "11px",
											color: "var(--text-muted)",
											textTransform: "uppercase",
											letterSpacing: "1px",
										}}
									>
										{pullProgress.model}
									</span>
								</div>
							</div>
							<div style={{ textAlign: "right" }}>
								<span
									style={{
										fontSize: "24px",
										fontWeight: 900,
										color:
											pullProgress.status === "completed" ? "var(--success)" : "var(--text-main)",
										letterSpacing: "-1px",
									}}
								>
									{pullProgress.percent}%
								</span>
							</div>
						</div>

						<div
							style={{
								width: "100%",
								height: "10px",
								background: "rgba(0,0,0,0.4)",
								borderRadius: "20px",
								overflow: "hidden",
								border: "1px solid rgba(255,255,255,0.05)",
								position: "relative",
							}}
						>
							<div
								className="progress-active"
								style={{
									width: `${pullProgress.percent}%`,
									height: "100%",
									background:
										pullProgress.status === "completed"
											? "var(--success)"
											: "linear-gradient(90deg, #4f8cff, #a5b4fc, #4f8cff)",
									backgroundSize: "200% 100%",
									transition: "width 0.4s cubic-bezier(0.1, 0.7, 0.1, 1)",
								}}
							/>
						</div>

						<div className="flex-between" style={{ marginTop: "12px" }}>
							<span style={{ fontSize: "10px", color: "var(--text-muted)", fontWeight: 600 }}>
								{pullProgress.status === "completed" ? "FINALIZADO" : "SINCRONIZANDO PESOS..."}
							</span>
							{pullProgress.status === "completed" && (
								<span style={{ fontSize: "10px", color: "var(--success)", fontWeight: 800 }}>
									✓ LISTO PARA OPERAR
								</span>
							)}
						</div>
					</div>
				)}

				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
						gap: "16px",
					}}
				>
					{(models?.filter((m) => !!m?.name) || []).length === 0 ? (
						<div style={{ gridColumn: "1/-1", textAlign: "center", opacity: 0.2, padding: "3rem" }}>
							<Info size={40} style={{ margin: "0 auto 12px", display: "block" }} />
							<p style={{ fontSize: "13px" }}>
								Sin modelos instalados. Descarga uno desde "Descubrir Modelos" abajo.
							</p>
						</div>
					) : (
						models
							.filter((m) => !!m?.name)
							.map((model: any) => {
								const sizeGb = model?.size > 0 ? (model.size / 1024 ** 3).toFixed(2) : null;
								return (
									<div
										key={model.name}
										className="card-glass"
										style={{
											padding: "16px",
											background: "rgba(255,255,255,0.02)",
											display: "flex",
											alignItems: "center",
											gap: "12px",
											justifyContent: "space-between",
										}}
									>
										<div style={{ flex: 1, minWidth: 0 }}>
											<p
												style={{
													fontSize: "13px",
													fontWeight: 700,
													color: "var(--text-main)",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{model.name}
											</p>
											<div
												style={{
													display: "flex",
													gap: "8px",
													marginTop: "6px",
													flexWrap: "wrap",
												}}
											>
												{model.details?.parameter_size && (
													<span
														style={{
															fontSize: "10px",
															color: "var(--text-muted)",
															background: "rgba(255,255,255,0.04)",
															padding: "2px 6px",
															borderRadius: "4px",
														}}
													>
														{model.details.parameter_size}
													</span>
												)}
												{sizeGb && (
													<span
														style={{
															fontSize: "10px",
															color: "var(--accent)",
															fontWeight: 700,
														}}
													>
														{sizeGb} GB
													</span>
												)}
											</div>
										</div>
										<div style={{ display: "flex", gap: "8px", flexShrink: 0 }}>
											<button
												className="btn-icon"
												onClick={() => onPull(model.name)}
												title="Actualizar"
											>
												<RefreshCw size={16} />
											</button>
											<button
												className="btn-icon"
												onClick={() => {
													if (confirm(`¿Eliminar ${model.name}?`)) onDelete(model.name);
												}}
												style={{ color: "var(--error)" }}
												title="Eliminar"
											>
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
			<div className="card-glass" style={{ padding: "20px", borderLeft: "3px solid var(--accent)" }}>
				<div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
					<BookOpen size={16} style={{ color: "var(--accent)" }} />
					<h3 style={{ fontSize: "12px", fontWeight: 700, letterSpacing: "1px" }}>¿CÓMO AGREGAR MODELOS?</h3>
				</div>
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
					<div
						style={{
							padding: "14px",
							background: "rgba(255,255,255,0.02)",
							borderRadius: "8px",
							border: "1px solid var(--border-light)",
						}}
					>
						<p
							style={{
								fontSize: "10px",
								fontWeight: 800,
								color: "var(--accent)",
								marginBottom: "6px",
								letterSpacing: "1px",
							}}
						>
							NOMBRE DIRECTO
						</p>
						<p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.5" }}>
							Escribe{" "}
							<code style={{ fontFamily: "var(--font-mono)", color: "var(--text-main)" }}>
								llama3.2:3b
							</code>{" "}
							en el buscador y presiona <strong>＋</strong>.
						</p>
					</div>
					<div
						style={{
							padding: "14px",
							background: "rgba(255,255,255,0.02)",
							borderRadius: "8px",
							border: "1px solid var(--border-light)",
						}}
					>
						<p
							style={{
								fontSize: "10px",
								fontWeight: 800,
								color: "var(--accent)",
								marginBottom: "6px",
								letterSpacing: "1px",
							}}
						>
							BÚSQUEDA EN LIBRERÍA
						</p>
						<p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.5" }}>
							Escribe{" "}
							<code style={{ fontFamily: "var(--font-mono)", color: "var(--text-main)" }}>vision</code> y
							presiona <strong>Enter</strong> para buscar en ollama.com.
						</p>
					</div>
				</div>
				<a
					href="https://ollama.com/library"
					target="_blank"
					rel="noopener noreferrer"
					style={{
						display: "inline-flex",
						alignItems: "center",
						gap: "6px",
						marginTop: "12px",
						fontSize: "11px",
						color: "var(--text-muted)",
						textDecoration: "none",
					}}
				>
					<ExternalLink size={11} /> Explorar Ollama Library completa →
				</a>
			</div>

			{/* ── Buscador ────────────────────────────────────────── */}
			<div className="card-glass p-8 animate-fade">
				<div className="flex-between" style={{ marginBottom: "20px" }}>
					<h2 style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
						<Sparkles size={22} style={{ color: "var(--accent)" }} />
						Descubrir Modelos
					</h2>
					<span
						className="badge"
						style={{
							background: "rgba(79, 140, 255, 0.1)",
							color: "var(--accent)",
							padding: "4px 12px",
							borderRadius: "6px",
							fontSize: "11px",
							fontWeight: 800,
						}}
					>
						OLLAMA LIBRARY
					</span>
				</div>

				<div className="model-search-bar">
					<div style={{ position: "relative", flex: 1 }}>
						<Search
							size={18}
							style={{
								position: "absolute",
								left: "16px",
								top: "50%",
								transform: "translateY(-50%)",
								opacity: 0.3,
							}}
						/>
						<input
							type="text"
							placeholder="Buscar en librería (Enter) o pegar nombre exacto con tag para descargar (ej: llama3.2:3b)..."
							className="pin-input"
							style={{
								padding: "14px 14px 14px 48px",
								textAlign: "left",
								fontSize: "13px",
								letterSpacing: "0",
							}}
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							onKeyDown={(e) => {
								if (e.key === "Enter") handleManualPull();
							}}
						/>
					</div>
					<button
						className="auth-btn"
						style={{ width: "auto", padding: "0 28px", display: "flex", alignItems: "center", gap: "8px" }}
						onClick={handleManualPull}
						disabled={isSearching}
					>
						{isSearching ? <Loader size={18} className="animate-spin" /> : <PlusCircle size={18} />}
					</button>
				</div>

				{searchError && (
					<p
						style={{
							fontSize: "12px",
							color: "var(--warning)",
							marginBottom: "8px",
							padding: "8px 12px",
							background: "rgba(245,158,11,0.08)",
							borderRadius: "6px",
							border: "1px solid rgba(245,158,11,0.2)",
						}}
					>
						⚠ {searchError}
					</p>
				)}

				<p style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "16px" }}>
					{hasSearched
						? `${searchResults.length} resultado(s) para "${searchTerm}" — haz clic en una tarjeta para descargar`
						: "Modelos populares sugeridos — haz clic para descargar o usa el buscador arriba"}
				</p>

				<div className="suggested-grid">
					{isSearching ? (
						<div style={{ gridColumn: "1/-1", textAlign: "center", padding: "32px", opacity: 0.4 }}>
							<Loader size={32} className="animate-spin" style={{ margin: "0 auto" }} />
							<p style={{ marginTop: "12px", fontSize: "12px" }}>Consultando ollama.com...</p>
						</div>
					) : (
						displayModels.map((s: any) => {
							const isInstalled = installedNames.some((n) => n.startsWith(s.name.split(":")[0]));
							return (
								<div
									key={s.name}
									className="suggested-card"
									onClick={() => !isInstalled && setVerificationModel(s)}
								>
									<div className="flex-between">
										<span className={`model-tag ${isInstalled ? "" : "prime"}`}>
											{s.tags?.[0] || "LLM"}
										</span>
										<span style={{ fontSize: "10px", opacity: 0.4 }}>{s.pulls || ""}</span>
									</div>
									<h3 style={{ fontSize: "14px", fontWeight: 700 }}>{s.title || s.name}</h3>
									<p
										style={{
											fontSize: "11px",
											color: "var(--text-dim)",
											lineHeight: "1.4",
											flex: 1,
										}}
									>
										{s.desc || "Modelo de la librería oficial de Ollama."}
									</p>
									{s.tags?.length > 1 && (
										<div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
											{s.tags.slice(1).map((t: string) => (
												<span
													key={t}
													style={{
														fontSize: "9px",
														padding: "1px 6px",
														background: "rgba(255,255,255,0.05)",
														borderRadius: "3px",
														color: "var(--text-muted)",
													}}
												>
													{t}
												</span>
											))}
										</div>
									)}
									{isInstalled ? (
										<span
											style={{
												fontSize: "10px",
												color: "var(--success)",
												fontWeight: 800,
												marginTop: "4px",
											}}
										>
											✓ INSTALADO
										</span>
									) : (
										<div
											style={{
												display: "flex",
												alignItems: "center",
												gap: "4px",
												color: "var(--accent)",
												fontSize: "11px",
												fontWeight: 800,
												marginTop: "4px",
											}}
										>
											<Download size={12} /> DESCARGAR
										</div>
									)}
								</div>
							);
						})
					)}
				</div>
			</div>

			{/* Modal de Verificación */}
			{verificationModel && (
				<div className="modal-overlay" onClick={() => setVerificationModel(null)}>
					<div className="verification-modal" onClick={(e) => e.stopPropagation()}>
						<div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
							<div
								style={{ background: "rgba(79, 140, 255, 0.1)", padding: "10px", borderRadius: "12px" }}
							>
								<Download size={24} style={{ color: "var(--accent)" }} />
							</div>
							<div>
								<h3 style={{ fontSize: "18px", fontWeight: 700 }}>Confirmar Descarga</h3>
								<p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
									LaLlamaStation Repository
								</p>
							</div>
						</div>

						<div
							className="card-glass"
							style={{ padding: "16px", background: "rgba(255,255,255,0.02)", marginBottom: "20px" }}
						>
							<p
								style={{
									fontSize: "14px",
									fontWeight: 700,
									color: "var(--accent)",
									marginBottom: "4px",
								}}
							>
								{verificationModel.title || verificationModel.name}
							</p>
							<p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.5" }}>
								{verificationModel.desc}
							</p>
							{verificationModel.tags && (
								<div style={{ display: "flex", gap: "6px", marginTop: "10px" }}>
									{verificationModel.tags.map((t: string) => (
										<span
											key={t}
											style={{
												fontSize: "10px",
												background: "rgba(255,255,255,0.05)",
												padding: "2px 8px",
												borderRadius: "4px",
												color: "var(--text-muted)",
											}}
										>
											{t}
										</span>
									))}
								</div>
							)}
						</div>

						<div
							style={{
								background: "rgba(245,158,11,0.05)",
								border: "1px solid rgba(245,158,11,0.2)",
								padding: "12px",
								borderRadius: "8px",
								marginBottom: "8px",
							}}
						>
							<p
								style={{
									fontSize: "11px",
									color: "var(--warning)",
									display: "flex",
									gap: "8px",
									alignItems: "center",
								}}
							>
								<Info size={14} />
								La descarga consumirá ancho de banda y espacio en disco significativo.
							</p>
						</div>

						<div className="modal-actions">
							<button
								className="btn-icon"
								style={{
									flex: 1,
									padding: "12px",
									borderRadius: "8px",
									fontSize: "13px",
									fontWeight: 600,
								}}
								onClick={() => setVerificationModel(null)}
							>
								Cancelar
							</button>
							<button
								className="auth-btn"
								style={{
									flex: 2,
									padding: "12px",
									fontSize: "13px",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: "8px",
								}}
								onClick={confirmPull}
							>
								<Download size={16} /> Confirmar Descarga
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
};
