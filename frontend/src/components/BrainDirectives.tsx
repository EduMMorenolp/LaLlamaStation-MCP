import { BookOpen, RefreshCw, Save } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { brainApi } from "../services/api.service";

interface BrainDirectivesProps {
	project: string;
}

export const BrainDirectives: React.FC<BrainDirectivesProps> = ({ project }) => {
	const [content, setContent] = useState("");
	const [loading, setLoading] = useState(false);
	const [saving, setSaving] = useState(false);
	const [successMsg, setSuccessMsg] = useState("");

	const fetchDirectives = useCallback(async () => {
		setLoading(true);
		try {
			const res = await brainApi.get(`/api/directives?project=${project}`);
			setContent(res.data.content || "");
		} catch (error) {
			console.error("Error fetching directives", error);
		} finally {
			setLoading(false);
		}
	}, [project]);

	useEffect(() => {
		fetchDirectives();
	}, [fetchDirectives]);

	const handleSave = async () => {
		setSaving(true);
		setSuccessMsg("");
		try {
			await brainApi.post("/api/directives", { project, content });
			setSuccessMsg("Directivas guardadas exitosamente.");
			setTimeout(() => setSuccessMsg(""), 3000);
		} catch (error) {
			console.error("Error saving directives", error);
		} finally {
			setSaving(false);
		}
	};

	return (
		<div
			className="card-glass"
			style={{ padding: "24px", minHeight: "calc(100vh - 200px)", display: "flex", flexDirection: "column" }}
		>
			<div className="flex-between" style={{ marginBottom: "20px" }}>
				<div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
					<BookOpen size={20} style={{ color: "var(--accent)" }} />
					<div>
						<h3 style={{ fontSize: "16px", fontWeight: 600 }}>Directivas Centrales (Core Directives)</h3>
						<p style={{ fontSize: "12px", color: "var(--text-dim)" }}>
							Define las reglas inmutables y personalidad del agente para el proyecto <b>{project}</b>.
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
					<span>{saving ? "Guardando..." : "Guardar Directivas"}</span>
				</button>
			</div>

			{successMsg && (
				<div
					style={{
						padding: "12px 16px",
						background: "rgba(34, 197, 94, 0.15)",
						color: "var(--success)",
						borderRadius: "8px",
						marginBottom: "16px",
						fontSize: "13px",
					}}
				>
					{successMsg}
				</div>
			)}

			<div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
				{loading ? (
					<div style={{ display: "flex", alignItems: "center", justifyContent: "center", flex: 1 }}>
						<RefreshCw size={24} className="animate-spin" style={{ color: "var(--accent)" }} />
					</div>
				) : (
					<textarea
						value={content}
						onChange={(e) => setContent(e.target.value)}
						placeholder="# Directivas de Proyecto&#10;&#10;1. Explica siempre el código antes de escribirlo.&#10;2. Mantén un estilo modular."
						style={{
							flex: 1,
							width: "100%",
							minHeight: "400px",
							background: "rgba(0,0,0,0.2)",
							border: "1px solid var(--border)",
							borderRadius: "8px",
							padding: "16px",
							color: "var(--text-main)",
							fontFamily: "var(--font-mono)",
							fontSize: "13px",
							lineHeight: 1.6,
							resize: "none",
						}}
					/>
				)}
			</div>
		</div>
	);
};
