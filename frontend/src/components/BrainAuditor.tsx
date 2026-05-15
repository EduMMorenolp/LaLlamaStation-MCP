import { Brain, RefreshCw, Search, Tag, Trash2 } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { brainApi } from "../services/api.service";

interface Memory {
	id: string;
	project: string;
	type: string;
	title: string;
	content: string;
	tags: string;
	phase?: string;
	agent?: string;
	createdAt: number;
	score?: number;
}

interface BrainAuditorProps {
	project: string;
}

export const BrainAuditor: React.FC<BrainAuditorProps> = ({ project }) => {
	const [memories, setMemories] = useState<Memory[]>([]);
	const [query, setQuery] = useState("");
	const [mode, setMode] = useState<"lexical" | "semantic" | "hybrid">("hybrid");
	const [loading, setLoading] = useState(false);

	const fetchMemories = useCallback(
		async (searchQuery = query) => {
			setLoading(true);
			try {
				const res = await brainApi.get(
					`/api/memory/search?q=${encodeURIComponent(searchQuery)}&project=${project}&mode=${mode}`
				);
				setMemories(res.data);
			} catch (error) {
				console.error("Error fetching brain memories", error);
			} finally {
				setLoading(false);
			}
		},
		[project, mode, query]
	);

	useEffect(() => {
		fetchMemories("");
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
		fetchMemories(query);
	};

	return (
		<>
			<style>{`
				.brain-memory-content {
					font-size: 13px;
					color: var(--text-main);
					line-height: 1.75;
					margin-bottom: 16px;
				}
				.brain-memory-content p {
					margin: 0 0 10px 0;
				}
				.brain-memory-content p:last-child {
					margin-bottom: 0;
				}
				.brain-memory-content h1,
				.brain-memory-content h2,
				.brain-memory-content h3,
				.brain-memory-content h4,
				.brain-memory-content h5,
				.brain-memory-content h6 {
					margin: 14px 0 8px;
					line-height: 1.3;
					font-weight: 700;
				}
				.brain-memory-content h1 { font-size: 18px; }
				.brain-memory-content h2 { font-size: 16px; }
				.brain-memory-content h3 { font-size: 14px; }
				.brain-memory-content h4 { font-size: 13px; }
				.brain-memory-content ul,
				.brain-memory-content ol {
					margin: 0 0 10px 0;
					padding-left: 20px;
				}
				.brain-memory-content li { margin-bottom: 4px; }
				.brain-memory-content blockquote {
					margin: 0 0 10px 0;
					border-left: 3px solid rgba(79,140,255,0.45);
					padding: 6px 12px;
					background: rgba(79,140,255,0.08);
					border-radius: 0 8px 8px 0;
					color: var(--text-dim);
				}
				.brain-memory-content code {
					font-family: var(--font-mono, monospace);
					font-size: 12px;
					background: rgba(0,0,0,0.28);
					border: 1px solid rgba(255,255,255,0.08);
					border-radius: 5px;
					padding: 1px 5px;
				}
				.brain-memory-content pre {
					margin: 0 0 10px 0;
					background: rgba(0,0,0,0.42);
					border: 1px solid rgba(255,255,255,0.1);
					border-radius: 8px;
					padding: 10px;
					overflow-x: auto;
				}
				.brain-memory-content pre code {
					background: transparent;
					border: none;
					padding: 0;
					display: block;
					white-space: pre;
				}
				.brain-memory-content a {
					color: var(--accent);
					text-decoration: underline;
					text-underline-offset: 2px;
				}
				.brain-memory-content hr {
					border: none;
					border-top: 1px solid rgba(255,255,255,0.12);
					margin: 12px 0;
				}
				.brain-memory-content table {
					width: 100%;
					border-collapse: collapse;
					margin: 0 0 10px 0;
					font-size: 12px;
					background: rgba(255,255,255,0.02);
					border: 1px solid rgba(255,255,255,0.12);
					border-radius: 8px;
					overflow: hidden;
				}
				.brain-memory-content th,
				.brain-memory-content td {
					border: 1px solid rgba(255,255,255,0.08);
					padding: 6px 10px;
					text-align: left;
				}
				.brain-memory-content th {
					background: rgba(255,255,255,0.06);
					font-weight: 700;
				}
				.brain-memory-content strong {
					font-weight: 700;
					color: var(--text-bright, #fff);
				}
			`}</style>
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
						>
							<div className="flex-between" style={{ marginBottom: "12px" }}>
								<div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
									<span
										className="badge"
										style={{ background: "rgba(79, 140, 255, 0.15)", color: "var(--accent)" }}
									>
										{mem.type}
									</span>
									{mem.phase && (
										<span
											className="badge"
											style={{ background: "rgba(168, 85, 247, 0.15)", color: "#c084fc" }}
										>
											Fase: {mem.phase}
										</span>
									)}
									<h4 style={{ fontSize: "15px", fontWeight: 600 }}>{mem.title}</h4>
								</div>
								<div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
									{mem.score !== undefined && (
										<span style={{ fontSize: "11px", color: "var(--success)", fontWeight: 700 }}>
											Similitud: {(mem.score * 100).toFixed(1)}%
										</span>
									)}
									<button
										type="button"
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
										onFocus={(e) => (e.currentTarget.style.opacity = "1")}
										onBlur={(e) => (e.currentTarget.style.opacity = "0.7")}
										title="Olvidar Recuerdo"
									>
										<Trash2 size={16} />
									</button>
								</div>
							</div>

							<div className="brain-memory-content">
								<ReactMarkdown remarkPlugins={[remarkGfm]}>
									{mem.content}
								</ReactMarkdown>
							</div>

							<div
								className="flex-between"
								style={{ borderTop: "1px solid var(--border)", paddingTop: "12px", alignItems: "center" }}
							>
								<div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
									{mem.tags
										.split(",")
										.map((tag) => tag.trim())
										.filter(Boolean)
										.map((tag) => (
											<span
												key={tag}
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
								<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
									{mem.agent && (
										<span
											style={{
												fontSize: "11px",
												color: "var(--accent)",
												background: "rgba(79, 140, 255, 0.1)",
												padding: "2px 8px",
												borderRadius: "4px",
												display: "flex",
												alignItems: "center",
												gap: "4px",
												fontWeight: 600,
												border: "1px solid rgba(79, 140, 255, 0.2)",
											}}
										>
											🤖 {mem.agent}
										</span>
									)}
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
						</div>
					))
				)}
			</div>
		</div>
		</>
	);
};
