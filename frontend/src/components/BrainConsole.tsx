import { Activity, BookOpen, Brain, Database, Settings } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { brainApi } from "../services/api.service";
import { BrainAuditor } from "./BrainAuditor";
import { BrainDirectives } from "./BrainDirectives";
import { BrainSettings } from "./BrainSettings";

interface BrainStats {
	total: number;
	types: { type: string; count: number }[];
}

export const BrainConsole: React.FC = () => {
	const [stats, setStats] = useState<BrainStats>({ total: 0, types: [] });
	const [project, setProject] = useState("lallamaollama");
	const [projectsList, setProjectsList] = useState<string[]>(["lallamaollama"]);
	const [activeTab, setActiveTab] = useState<"auditor" | "directives" | "settings">("auditor");

	const fetchStats = useCallback(async () => {
		try {
			const res = await brainApi.get(`/api/memory/stats?project=${project}`);
			setStats(res.data);
		} catch (error) {
			console.error("Error fetching brain stats", error);
		}
	}, [project]);

	const fetchProjects = useCallback(async () => {
		try {
			const res = await brainApi.get("/api/projects");
			if (res.data && Array.isArray(res.data)) {
				setProjectsList(res.data);
			}
		} catch (error) {
			console.error("Error fetching projects", error);
		}
	}, []);

	useEffect(() => {
		fetchStats();
		fetchProjects();
	}, [fetchStats, fetchProjects]);

	const handleAddProject = () => {
		const name = window.prompt("Ingresa el nombre del nuevo proyecto:");
		if (name?.trim()) {
			const cleanName = name
				.trim()
				.toLowerCase()
				.replace(/[^a-z0-9]+/g, "-");
			setProjectsList((prev) => Array.from(new Set([...prev, cleanName])));
			setProject(cleanName);
		}
	};

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
			{/* Navegación de Pestañas */}
			<div
				style={{ display: "flex", gap: "12px", borderBottom: "1px solid var(--border)", paddingBottom: "12px" }}
			>
				<button
					onClick={() => setActiveTab("auditor")}
					type="button"
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "10px 20px",
						borderRadius: "8px",
						fontSize: "13px",
						fontWeight: 600,
						border: "none",
						background: activeTab === "auditor" ? "rgba(79, 140, 255, 0.15)" : "transparent",
						color: activeTab === "auditor" ? "var(--accent)" : "var(--text-dim)",
						cursor: "pointer",
						transition: "var(--transition)",
					}}
				>
					<Brain size={16} /> Auditor de Memoria
				</button>
				<button
					onClick={() => setActiveTab("directives")}
					type="button"
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "10px 20px",
						borderRadius: "8px",
						fontSize: "13px",
						fontWeight: 600,
						border: "none",
						background: activeTab === "directives" ? "rgba(79, 140, 255, 0.15)" : "transparent",
						color: activeTab === "directives" ? "var(--accent)" : "var(--text-dim)",
						cursor: "pointer",
						transition: "var(--transition)",
					}}
				>
					<BookOpen size={16} /> Directivas Centrales
				</button>
				<button
					onClick={() => setActiveTab("settings")}
					type="button"
					style={{
						display: "flex",
						alignItems: "center",
						gap: "8px",
						padding: "10px 20px",
						borderRadius: "8px",
						fontSize: "13px",
						fontWeight: 600,
						border: "none",
						background: activeTab === "settings" ? "rgba(79, 140, 255, 0.15)" : "transparent",
						color: activeTab === "settings" ? "var(--accent)" : "var(--text-dim)",
						cursor: "pointer",
						transition: "var(--transition)",
					}}
				>
					<Settings size={16} /> Ajustes Cognitivos
				</button>
			</div>

			<div style={{ display: "grid", gridTemplateColumns: "1fr 300px", gap: "24px", alignItems: "start" }}>
				{/* Panel Principal dinámico */}
				<div style={{ minWidth: 0 }}>
					{activeTab === "auditor" && <BrainAuditor project={project} />}
					{activeTab === "directives" && <BrainDirectives project={project} />}
					{activeTab === "settings" && <BrainSettings project={project} />}
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
							<div style={{ fontSize: "28px", fontWeight: 700, letterSpacing: "-1px" }}>
								{stats.total}
							</div>
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
								<div className="flex-between" style={{ alignItems: "center", marginBottom: "4px" }}>
									<span
										style={{
											fontSize: "10px",
											color: "var(--text-dim)",
											textTransform: "uppercase",
										}}
									>
										Proyecto Target
									</span>
									<button
										onClick={handleAddProject}
										type="button"
										style={{
											fontSize: "10px",
											background: "rgba(79, 140, 255, 0.2)",
											color: "var(--accent)",
											border: "none",
											borderRadius: "4px",
											padding: "2px 6px",
											cursor: "pointer",
											fontWeight: 600,
										}}
									>
										+ Nuevo
									</button>
								</div>
								<select
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
										fontFamily: "var(--font-mono)",
										cursor: "pointer",
									}}
								>
									{projectsList.map((p) => (
										<option key={p} value={p}>
											{p}
										</option>
									))}
								</select>
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
		</div>
	);
};
