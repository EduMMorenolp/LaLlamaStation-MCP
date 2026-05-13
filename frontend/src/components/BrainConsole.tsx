import { Activity, Brain, Database, RefreshCw, Search, Tag, Trash2 } from "lucide-react";
import type React from "react";
import { useEffect, useState } from "react";
import { brainApi } from "../services/api.service";

interface Memory {
	id: string;
	project: string;
	type: string;
	title: string;
	content: string;
	tags: string;
	createdAt: number;
	score?: number;
}

interface BrainStats {
	total: number;
	types: { type: string; count: number }[];
}

export const BrainConsole: React.FC = () => {
	const [memories, setMemories] = useState<Memory[]>([]);
	const [stats, setStats] = useState<BrainStats>({ total: 0, types: [] });
	const [query, setQuery] = useState("");
	const [mode, setMode] = useState<"lexical" | "semantic" | "hybrid">("hybrid");
	const [loading, setLoading] = useState(false);
	const [project, setProject] = useState("lallamastation"); // Default project

	const fetchMemories = async (searchQuery = query) => {
		setLoading(true);
		try {
			const [memRes, statRes] = await Promise.all([
				brainApi.get(`/api/memory/search?q=${encodeURIComponent(searchQuery)}&project=${project}&mode=${mode}`),
				brainApi.get(`/api/memory/stats?project=${project}`),
			]);
			setMemories(memRes.data);
			setStats(statRes.data);
		} catch (error) {
			console.error("Error fetching brain data", error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchMemories();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [fetchMemories]);

	const handleDelete = async (id: string) => {
		if (!window.confirm("¿Seguro que deseas borrar este recuerdo del cerebro?")) return;
		try {
			await brainApi.delete(`/api/memory/${id}`);
			fetchMemories();
		} catch (error) {
			console.error("Error deleting memory", error);
		}
	};

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		fetchMemories();
	};

	return (
		<div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" }}>
			{/* Panel Principal: Buscador y Lista de Recuerdos */}
			<div className="card-glass" style={{ padding: "24px", minHeight: "calc(100vh - 200px)" }}>
				<form onSubmit={handleSearch} className="model-search-bar" style={{ marginBottom: "24px" }}>
					<div className="input-container" style={{ flex: 1 }}>
						<Search size={18} style={{ color: "var(--text-muted)" }} />
						<input
							type="text"
							placeholder="Buscar en el conocimiento del agente..."
							value={query}
							onChange={(e) => setQuery(e.target.value)}
							className="input-field"
						/>
					</div>
					<button
						type="submit"
						className="btn-send"
						disabled={loading}
						style={{ width: "auto", padding: "0 20px" }}
					>
						{loading ? <RefreshCw size={18} className="animate-spin" /> : "Analizar"}
					</button>
				</form>

				<div className="flex-between" style={{ marginBottom: "16px", padding: "0 8px" }}>
					<div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
						<span
							style={{
								fontSize: "11px",
								fontWeight: 700,
								letterSpacing: "1px",
								color: "var(--text-muted)",
								textTransform: "uppercase",
							}}
						>
							Motor de Búsqueda
						</span>
						<div
							style={{
								display: "flex",
								background: "rgba(0,0,0,0.3)",
								borderRadius: "6px",
								padding: "4px",
							}}
						>
							{(["lexical", "hybrid", "semantic"] as const).map((m) => (
								<button
									key={m}
									onClick={() => setMode(m)}
									type="button"
									style={{
										padding: "4px 12px",
										fontSize: "11px",
										fontWeight: 600,
										borderRadius: "4px",
										background: mode === m ? "rgba(79, 140, 255, 0.2)" : "transparent",
										color: mode === m ? "var(--accent)" : "var(--text-dim)",
										border: "none",
										cursor: "pointer",
										transition: "var(--transition)",
										textTransform: "uppercase",
									}}
								>
									{m === "lexical" ? "FTS5 (Rápido)" : m === "semantic" ? "Vectores (IA)" : "Híbrido"}
								</button>
							))}
						</div>
					</div>
					<span style={{ fontSize: "12px", color: "var(--text-dim)" }}>
						Mostrando {memories.length} resultados
					</span>
				</div>

				<div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
					{memories.length === 0 ? (
						<div style={{ textAlign: "center", padding: "64px 0", opacity: 0.3 }}>
							<Brain size={48} style={{ margin: "0 auto 16px" }} />
							<p>No hay recuerdos en el cerebro para este proyecto.</p>
						</div>
					) : (
						memories.map((mem) => (
							<div
								key={mem.id}
								style={{
									background: "rgba(255,255,255,0.02)",
									border: "1px solid var(--border-light)",
									borderRadius: "12px",
									padding: "16px",
									transition: "var(--transition)",
								}}
								onMouseOver={(e) => (e.currentTarget.style.borderColor = "var(--accent-glow)")}
								onMouseOut={(e) => (e.currentTarget.style.borderColor = "var(--border-light)")}
							>
								<div className="flex-between" style={{ marginBottom: "12px" }}>
									<div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
										<span
											className="badge"
											style={{ background: "rgba(79, 140, 255, 0.15)", color: "var(--accent)" }}
										>
											{mem.type}
										</span>
										<h4 style={{ fontSize: "15px", fontWeight: 600 }}>{mem.title}</h4>
									</div>
									<div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
										{mem.score !== undefined && (
											<span
												style={{ fontSize: "11px", color: "var(--success)", fontWeight: 700 }}
											>
												Similitud: {(mem.score * 100).toFixed(1)}%
											</span>
										)}
										<button
											onClick={() => handleDelete(mem.id)}
											style={{
												background: "none",
												border: "none",
												color: "var(--error)",
												opacity: 0.7,
												cursor: "pointer",
												transition: "0.2s",
											}}
											onMouseOver={(e) => (e.currentTarget.style.opacity = "1")}
											onMouseOut={(e) => (e.currentTarget.style.opacity = "0.7")}
											title="Olvidar Recuerdo"
										>
											<Trash2 size={16} />
										</button>
									</div>
								</div>

								<p
									style={{
										fontSize: "13px",
										color: "var(--text-main)",
										lineHeight: 1.5,
										marginBottom: "16px",
										whiteSpace: "pre-wrap",
									}}
								>
									{mem.content}
								</p>

								<div
									className="flex-between"
									style={{ borderTop: "1px solid var(--border)", paddingTop: "12px" }}
								>
									<div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
										{mem.tags
											.split(",")
											.map((tag) => tag.trim())
											.filter(Boolean)
											.map((tag, idx) => (
												<span
													key={idx}
													style={{
														fontSize: "10px",
														padding: "2px 8px",
														background: "var(--bg-input)",
														borderRadius: "4px",
														color: "var(--text-dim)",
														display: "flex",
														alignItems: "center",
														gap: "4px",
													}}
												>
													<Tag size={10} /> {tag}
												</span>
											))}
									</div>
									<span
										style={{
											fontSize: "11px",
											color: "var(--text-muted)",
											fontFamily: "var(--font-mono)",
										}}
									>
										{new Date(mem.createdAt).toLocaleString()}
									</span>
								</div>
							</div>
						))
					)}
				</div>
			</div>

			{/* Panel Lateral: KPIs y Estadísticas */}
			<div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
				<div
					className="card-glass"
					style={{ padding: "20px", display: "flex", alignItems: "center", gap: "16px" }}
				>
					<div
						style={{
							width: "48px",
							height: "48px",
							borderRadius: "12px",
							background: "rgba(79, 140, 255, 0.15)",
							color: "var(--accent)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
						}}
					>
						<Brain size={24} />
					</div>
					<div>
						<h3
							style={{
								fontSize: "11px",
								textTransform: "uppercase",
								letterSpacing: "1px",
								color: "var(--text-muted)",
								marginBottom: "4px",
							}}
						>
							Total Recuerdos
						</h3>
						<div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-1px" }}>{stats.total}</div>
					</div>
				</div>

				<div className="card-glass" style={{ padding: "20px" }}>
					<h3
						style={{
							fontSize: "11px",
							fontWeight: 700,
							letterSpacing: "1.5px",
							color: "var(--text-muted)",
							marginBottom: "16px",
							textTransform: "uppercase",
							display: "flex",
							alignItems: "center",
							gap: "8px",
						}}
					>
						<Database size={14} /> Distribución de Conocimiento
					</h3>
					{stats.types.length === 0 ? (
						<p
							style={{
								fontSize: "12px",
								color: "var(--text-dim)",
								textAlign: "center",
								padding: "12px 0",
							}}
						>
							Sin datos registrados
						</p>
					) : (
						<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
							{stats.types.map((type) => (
								<div key={type.type}>
									<div className="flex-between" style={{ marginBottom: "6px" }}>
										<span style={{ fontSize: "12px", textTransform: "capitalize" }}>
											{type.type}
										</span>
										<span style={{ fontSize: "11px", fontWeight: 700, color: "var(--accent)" }}>
											{type.count}
										</span>
									</div>
									<div
										style={{
											height: "4px",
											background: "var(--bg-input)",
											borderRadius: "2px",
											overflow: "hidden",
										}}
									>
										<div
											style={{
												height: "100%",
												background: "var(--accent)",
												width: `${(type.count / stats.total) * 100}%`,
												borderRadius: "2px",
											}}
										/>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				<div className="card-glass" style={{ padding: "20px" }}>
					<h3
						style={{
							fontSize: "11px",
							fontWeight: 700,
							letterSpacing: "1.5px",
							color: "var(--text-muted)",
							marginBottom: "16px",
							textTransform: "uppercase",
							display: "flex",
							alignItems: "center",
							gap: "8px",
						}}
					>
						<Activity size={14} /> Contexto Activo
					</h3>
					<div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
						<div>
							<span style={{ fontSize: "10px", color: "var(--text-dim)", textTransform: "uppercase" }}>
								Proyecto Target
							</span>
							<input
								type="text"
								value={project}
								onChange={(e) => setProject(e.target.value)}
								style={{
									width: "100%",
									padding: "8px",
									background: "var(--bg-input)",
									border: "1px solid var(--border)",
									borderRadius: "6px",
									color: "white",
									fontSize: "12px",
									marginTop: "4px",
									fontFamily: "var(--font-mono)",
								}}
							/>
						</div>
						<div
							style={{
								fontSize: "11px",
								color: "var(--text-dim)",
								lineHeight: 1.5,
								background: "rgba(0,0,0,0.2)",
								padding: "10px",
								borderRadius: "6px",
							}}
						>
							El Cerebro usa <b>SQLite FTS5</b> para búsquedas instantáneas y{" "}
							<b>Vector Embeddings (Ollama)</b> para entender el contexto semántico entre recuerdos.
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
