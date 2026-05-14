import { Activity, Copy, Cpu, Info, Play, RefreshCw, Save, ShieldAlert } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { api, brainApi } from "../services/api.service";

interface BrainSettingsProps {
	project: string;
}

export const BrainSettings: React.FC<BrainSettingsProps> = ({ project }) => {
	const [threshold, setThreshold] = useState("3");
	const [model, setModel] = useState("llama3.2");
	const [modelsList, setModelsList] = useState<string[]>(["llama3.2"]);
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [syncing, setSyncing] = useState(false);
	const [syncMsg, setSyncMsg] = useState("");
	const [consolidating, setConsolidating] = useState(false);
	const [consolidationRes, setConsolidationRes] = useState<{
		consolidatedGroups?: number;
		deletedMemories?: number;
	} | null>(null);
	const [successMsg, setSuccessMsg] = useState("");

	const fetchSettings = useCallback(async () => {
		setLoading(true);
		try {
			const [thRes, modRes, modelsRes] = await Promise.all([
				brainApi.get("/api/settings/delegation_threshold"),
				brainApi.get("/api/settings/consolidation_model"),
				api.get("/api/models").catch(() => ({ data: { models: [] } })),
			]);
			if (thRes.data.value) setThreshold(thRes.data.value);
			if (modRes.data.value) setModel(modRes.data.value);
			if (modelsRes.data && Array.isArray(modelsRes.data.models)) {
				const names = modelsRes.data.models.map((m: any) => m.name.split(":")[0]);
				setModelsList(Array.from(new Set(["llama3.2", ...names])));
			}
		} catch (error) {
			console.error("Error fetching brain settings", error);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchSettings();
	}, [fetchSettings]);

	const handleSave = async () => {
		setSaving(true);
		setSuccessMsg("");
		try {
			await Promise.all([
				brainApi.post("/api/settings", { key: "delegation_threshold", value: threshold }),
				brainApi.post("/api/settings", { key: "consolidation_model", value: model }),
			]);
			setSuccessMsg("Ajustes guardados exitosamente.");
			setTimeout(() => setSuccessMsg(""), 3000);
		} catch (error) {
			console.error("Error saving settings", error);
		} finally {
			setSaving(false);
		}
	};

	const handleSync = async (target: string) => {
		setSyncing(true);
		setSyncMsg("");
		try {
			const res = await brainApi.post("/api/mcp/sync", { target });
			if (res.data.config) {
				await navigator.clipboard.writeText(JSON.stringify(res.data.config, null, 2));
				setSyncMsg(`${res.data.message} (Copiado al portapapeles)`);
			} else {
				setSyncMsg(res.data.message);
			}
		} catch (error: any) {
			setSyncMsg(`Error: ${error.response?.data?.error || error.message}`);
		} finally {
			setSyncing(false);
		}
	};

	const handleConsolidate = async () => {
		if (!window.confirm(`¿Iniciar consolidación de memorias para el proyecto "${project}"?`)) return;
		setConsolidating(true);
		setConsolidationRes(null);
		try {
			const res = await brainApi.post("/api/memory/consolidate", { project });
			setConsolidationRes(res.data);
		} catch (error) {
			console.error("Error consolidating memories", error);
		} finally {
			setConsolidating(false);
		}
	};

	return (
		<div
			className="card-glass"
			style={{
				padding: "24px",
				minHeight: "calc(100vh - 200px)",
				display: "flex",
				flexDirection: "column",
				gap: "28px",
			}}
		>
			<div className="flex-between">
				<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
					<Cpu size={20} style={{ color: "var(--accent)" }} />
					<div>
						<h3 style={{ fontSize: "16px", fontWeight: 600 }}>Configuración y Mantenimiento Cognitivo</h3>
						<p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
							Ajusta el comportamiento de gatillos de intervención y mantenimiento automatizado.
						</p>
					</div>
				</div>
				<button
					onClick={handleSave}
					className="btn-send"
					disabled={saving || loading}
					style={{ width: "auto", padding: "0 20px" }}
				>
					{saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
					<span>{saving ? "Guardando..." : "Guardar Ajustes"}</span>
				</button>
			</div>

			{successMsg && (
				<div
					style={{
						padding: "12px 16px",
						background: "rgba(34, 197, 94, 0.15)",
						color: "var(--success)",
						borderRadius: "8px",
						fontSize: "13px",
					}}
				>
					{successMsg}
				</div>
			)}

			<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
				{/* Umbral de Delegación */}
				<div
					style={{
						background: "rgba(0,0,0,0.2)",
						border: "1px solid var(--border)",
						borderRadius: "12px",
						padding: "20px",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							marginBottom: "12px",
							color: "var(--accent)",
						}}
					>
						<ShieldAlert size={18} />
						<h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>
							Gatillos de Delegación (Threshold)
						</h4>
					</div>
					<p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "16px", lineHeight: 1.5 }}>
						Número máximo de búsquedas idénticas permitidas en un lapso de 5 minutos antes de forzar al
						agente a detenerse o cambiar de fase SDD.
					</p>
					<select
						value={threshold}
						onChange={(e) => setThreshold(e.target.value)}
						className="input-field"
						style={{
							width: "100%",
							background: "var(--bg-input)",
							border: "1px solid var(--border)",
							color: "white",
							padding: "10px 14px",
							borderRadius: "8px",
							cursor: "pointer",
							fontFamily: "var(--font-mono)",
							fontSize: "13px",
						}}
					>
						{[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
							<option key={num} value={num}>
								{num} {num === 1 ? "búsqueda repetida" : "búsquedas repetidas"}
							</option>
						))}
					</select>
				</div>

				{/* Modelo de Consolidación */}
				<div
					style={{
						background: "rgba(0,0,0,0.2)",
						border: "1px solid var(--border)",
						borderRadius: "12px",
						padding: "20px",
					}}
				>
					<div
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							marginBottom: "12px",
							color: "var(--accent)",
						}}
					>
						<Activity size={18} />
						<h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>
							Modelo de Consolidación
						</h4>
					</div>
					<p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "16px", lineHeight: 1.5 }}>
						Modelo de IA utilizado por Ollama para ejecutar la agrupación y resumen de aprendizajes
						redundantes en background.
					</p>
					<select
						value={model}
						onChange={(e) => setModel(e.target.value)}
						className="input-field"
						style={{
							width: "100%",
							background: "var(--bg-input)",
							border: "1px solid var(--border)",
							color: "white",
							padding: "10px 14px",
							borderRadius: "8px",
							cursor: "pointer",
							fontFamily: "var(--font-mono)",
							fontSize: "13px",
						}}
					>
						{modelsList.map((m) => (
							<option key={m} value={m}>
								{m}
							</option>
						))}
					</select>
				</div>
			</div>

			{/* Auto Sincronización de IDEs */}
			<div
				style={{
					background: "rgba(0,0,0,0.2)",
					border: "1px solid var(--border)",
					borderRadius: "12px",
					padding: "20px",
				}}
			>
				<div className="flex-between" style={{ flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
					<div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--accent)" }}>
						<Cpu size={18} />
						<h4 style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-main)" }}>
							⚡ Auto-Sincronización de Agentes IA (MCP Installer)
						</h4>
					</div>
					<button
						onClick={() => handleSync("cursor")}
						className="btn-send"
						style={{
							width: "auto",
							padding: "0 16px",
							background: "rgba(255,255,255,0.08)",
							color: "white",
							border: "1px solid rgba(255,255,255,0.15)",
						}}
						title="Copia el bloque JSON listo para pegar en cualquier cliente MCP"
					>
						<Copy size={14} />
						<span>Copiar Configuración MCP</span>
					</button>
				</div>
				<p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "16px", lineHeight: 1.5 }}>
					Conecta e inyecta de forma automática la configuración de LaLlamaStation Brain en tus herramientas
					de desarrollo favoritas.
				</p>

				{syncMsg && (
					<div
						style={{
							padding: "10px 14px",
							background: syncMsg.startsWith("Error") ? "rgba(239,68,68,0.15)" : "rgba(34,197,94,0.15)",
							color: syncMsg.startsWith("Error") ? "var(--error)" : "var(--success)",
							borderRadius: "8px",
							marginBottom: "16px",
							fontSize: "12px",
							fontFamily: "var(--font-mono)",
						}}
					>
						{syncMsg}
					</div>
				)}

				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
						gap: "12px",
					}}
				>
					{/* OpenCode */}
					<div style={{ display: "flex", gap: "6px" }}>
						<button
							onClick={() => handleSync("opencode")}
							disabled={syncing}
							className="btn-send"
							style={{
								flex: 1,
								padding: "12px",
								fontSize: "12px",
								background: "rgba(79,140,255,0.15)",
								color: "var(--accent)",
								border: "1px solid var(--accent)",
							}}
						>
							🚀 Inyectar en OpenCode AI
						</button>
						<button
							className="btn-icon"
							style={{
								width: "42px",
								height: "42px",
								background: "rgba(255,255,255,0.05)",
								border: "1px solid var(--border)",
								borderRadius: "8px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
							title="Ruta manual: opencode.json en la raíz del workspace"
						>
							<Info size={16} style={{ color: "var(--text-muted)" }} />
						</button>
					</div>

					{/* Antigravity */}
					<div style={{ display: "flex", gap: "6px" }}>
						<button
							onClick={() => handleSync("antigravity")}
							disabled={syncing}
							className="btn-send"
							style={{
								flex: 1,
								padding: "12px",
								fontSize: "12px",
								background: "rgba(168,85,247,0.15)",
								color: "#c084fc",
								border: "1px solid #c084fc",
							}}
						>
							🌌 Inyectar en Antigravity AI
						</button>
						<button
							className="btn-icon"
							style={{
								width: "42px",
								height: "42px",
								background: "rgba(255,255,255,0.05)",
								border: "1px solid var(--border)",
								borderRadius: "8px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
							title="Ruta manual: C:\Users\tu_usuario\.gemini\antigravity\mcp_config.json"
						>
							<Info size={16} style={{ color: "var(--text-muted)" }} />
						</button>
					</div>

					{/* RooCode */}
					<div style={{ display: "flex", gap: "6px" }}>
						<button
							onClick={() => handleSync("roocode")}
							disabled={syncing}
							className="btn-send"
							style={{
								flex: 1,
								padding: "12px",
								fontSize: "12px",
								background: "rgba(239,68,68,0.15)",
								color: "#f87171",
								border: "1px solid #f87171",
							}}
						>
							🦊 Inyectar en RooCode (VS Code)
						</button>
						<button
							className="btn-icon"
							style={{
								width: "42px",
								height: "42px",
								background: "rgba(255,255,255,0.05)",
								border: "1px solid var(--border)",
								borderRadius: "8px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
							title="Ruta manual en VS Code: %APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\claude_desktop_config.json"
						>
							<Info size={16} style={{ color: "var(--text-muted)" }} />
						</button>
					</div>

					{/* Claude Desktop */}
					<div style={{ display: "flex", gap: "6px" }}>
						<button
							onClick={() => handleSync("claudedesktop")}
							disabled={syncing}
							className="btn-send"
							style={{
								flex: 1,
								padding: "12px",
								fontSize: "12px",
								background: "rgba(249,115,22,0.15)",
								color: "#fb923c",
								border: "1px solid #fb923c",
							}}
						>
							🟧 Inyectar en Claude Desktop
						</button>
						<button
							className="btn-icon"
							style={{
								width: "42px",
								height: "42px",
								background: "rgba(255,255,255,0.05)",
								border: "1px solid var(--border)",
								borderRadius: "8px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
							title="Ruta manual: %APPDATA%\Claude\claude_desktop_config.json"
						>
							<Info size={16} style={{ color: "var(--text-muted)" }} />
						</button>
					</div>

					{/* Cursor */}
					<div style={{ display: "flex", gap: "6px" }}>
						<button
							onClick={() => handleSync("cursor")}
							disabled={syncing}
							className="btn-send"
							style={{
								flex: 1,
								padding: "12px",
								fontSize: "12px",
								background: "rgba(255,255,255,0.05)",
								color: "var(--text-main)",
							}}
						>
							⚡ Copiar para Cursor IDE
						</button>
						<button
							className="btn-icon"
							style={{
								width: "42px",
								height: "42px",
								background: "rgba(255,255,255,0.05)",
								border: "1px solid var(--border)",
								borderRadius: "8px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
							title="En Cursor IDE: Settings > Features > MCP > + Add New MCP Server"
						>
							<Info size={16} style={{ color: "var(--text-muted)" }} />
						</button>
					</div>

					{/* Windsurf */}
					<div style={{ display: "flex", gap: "6px" }}>
						<button
							onClick={() => handleSync("windsurf")}
							disabled={syncing}
							className="btn-send"
							style={{
								flex: 1,
								padding: "12px",
								fontSize: "12px",
								background: "rgba(255,255,255,0.05)",
								color: "var(--text-main)",
							}}
						>
							⚡ Copiar para Windsurf
						</button>
						<button
							className="btn-icon"
							style={{
								width: "42px",
								height: "42px",
								background: "rgba(255,255,255,0.05)",
								border: "1px solid var(--border)",
								borderRadius: "8px",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
							}}
							title="En Windsurf IDE: %USERPROFILE%\.codeium\windsurf\mcp_config.json"
						>
							<Info size={16} style={{ color: "var(--text-muted)" }} />
						</button>
					</div>
				</div>
			</div>

			{/* Consolidación Manual */}
			<div
				style={{
					background: "rgba(79, 140, 255, 0.05)",
					border: "1px solid rgba(79, 140, 255, 0.2)",
					borderRadius: "12px",
					padding: "20px",
					marginTop: "auto",
				}}
			>
				<div className="flex-between" style={{ flexWrap: "wrap", gap: "16px" }}>
					<div>
						<h4 style={{ fontSize: "15px", fontWeight: 600, color: "var(--accent)", marginBottom: "4px" }}>
							Mantenimiento Proactivo: Consolidación Manual
						</h4>
						<p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
							Analiza memorias redundantes del proyecto <b>{project}</b> y fusionalas en Key Learnings
							limpios.
						</p>
					</div>
					<button
						onClick={handleConsolidate}
						className="btn-send"
						disabled={consolidating}
						style={{ width: "auto", padding: "0 24px", background: "var(--accent)", color: "#000" }}
					>
						{consolidating ? <RefreshCw size={16} className="animate-spin" /> : <Play size={16} />}
						<span>{consolidating ? "Consolidando..." : "Ejecutar Consolidación"}</span>
					</button>
				</div>

				{consolidationRes && (
					<div
						style={{
							marginTop: "16px",
							padding: "12px",
							background: "rgba(0,0,0,0.3)",
							borderRadius: "8px",
							fontSize: "13px",
							display: "flex",
							gap: "16px",
							borderLeft: "3px solid var(--accent)",
						}}
					>
						<div>
							Grupos Consolidados: <b>{consolidationRes.consolidatedGroups || 0}</b>
						</div>
						<div>
							Memorias Antiguas Eliminadas: <b>{consolidationRes.deletedMemories || 0}</b>
						</div>
					</div>
				)}
			</div>
		</div>
	);
};
