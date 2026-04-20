import { Eye, EyeOff, PlugZap, Save, ShieldAlert, ShieldCheck } from "lucide-react";
import type React from "react";
import { useMemo, useState } from "react";
import type { StatusResponse } from "../types/api";

interface ConnectionPanelProps {
	status?: StatusResponse;
	apiKeyValue: string;
	rememberKey: boolean;
	onSaveApiKey: (nextKey: string, remember: boolean) => Promise<void>;
	onToggleMcpAuth: (enabled: boolean) => Promise<void>;
}

export const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
	status,
	apiKeyValue,
	rememberKey,
	onSaveApiKey,
	onToggleMcpAuth,
}) => {
	const [apiKeyInput, setApiKeyInput] = useState(apiKeyValue);
	const [remember, setRemember] = useState(rememberKey);
	const [showKey, setShowKey] = useState(false);
	const [saving, setSaving] = useState(false);
	const [mcpUpdating, setMcpUpdating] = useState(false);
	const [message, setMessage] = useState<string | null>(null);

	const mcpAuthEnabled = status?.auth?.mcpAuthEnabled ?? true;
	const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";
	const mcpSseUrl = useMemo(() => `${baseUrl}/sse`, [baseUrl]);
	const mcpMessagesUrl = useMemo(() => `${baseUrl}/messages`, [baseUrl]);

	const handleSave = async () => {
		setSaving(true);
		setMessage(null);
		try {
			await onSaveApiKey(apiKeyInput, remember);
			setMessage("API Key actualizada y validada correctamente.");
		} catch (err: any) {
			setMessage(err?.message || "No se pudo actualizar la API Key.");
		} finally {
			setSaving(false);
		}
	};

	const handleToggleMcp = async () => {
		setMcpUpdating(true);
		setMessage(null);
		try {
			await onToggleMcpAuth(!mcpAuthEnabled);
			setMessage(`MCP auth ${!mcpAuthEnabled ? "habilitado" : "deshabilitado"}.`);
		} catch (err: any) {
			setMessage(err?.response?.data?.error || err?.message || "No se pudo actualizar MCP.");
		} finally {
			setMcpUpdating(false);
		}
	};

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
			<div className="kpi-grid" style={{ marginBottom: 0 }}>
				<div className="kpi-card">
					<span className="kpi-label">API Key</span>
					<p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "12px" }}>
						Esta clave se usa para autenticar este dashboard contra el backend.
					</p>

					<div style={{ position: "relative", marginBottom: "10px" }}>
						<input
							type={showKey ? "text" : "password"}
							value={apiKeyInput}
							onChange={(e) => setApiKeyInput(e.target.value)}
							placeholder="Ingresa API Key"
							className="pin-input"
							style={{
								textAlign: "left",
								fontSize: "14px",
								letterSpacing: "0.4px",
								paddingRight: "46px",
							}}
						/>
						<button
							type="button"
							onClick={() => setShowKey((v) => !v)}
							style={{
								position: "absolute",
								right: "12px",
								top: "50%",
								transform: "translateY(-50%)",
								background: "transparent",
								border: "none",
								cursor: "pointer",
								color: "var(--text-muted)",
							}}
						>
							{showKey ? <EyeOff size={16} /> : <Eye size={16} />}
						</button>
					</div>

					<label
						style={{
							display: "flex",
							alignItems: "center",
							gap: "8px",
							fontSize: "12px",
							color: "var(--text-dim)",
							marginBottom: "14px",
						}}
					>
						<input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
						Recordar API Key en esta estacion
					</label>

					<button
						onClick={handleSave}
						disabled={saving}
						className="btn-primary"
						style={{ width: "100%", justifyContent: "center", display: "flex", gap: "8px" }}
					>
						<Save size={14} /> {saving ? "Validando..." : "Guardar y Validar"}
					</button>
				</div>

				<div className="kpi-card" style={{ borderColor: mcpAuthEnabled ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.25)" }}>
					<span className="kpi-label">MCP</span>
					<div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
						{mcpAuthEnabled ? <ShieldCheck size={16} color="var(--success)" /> : <ShieldAlert size={16} color="var(--warning)" />}
						<span className="kpi-value" style={{ fontSize: "18px", color: mcpAuthEnabled ? "var(--success)" : "var(--warning)" }}>
							{mcpAuthEnabled ? "AUTH ACTIVA" : "AUTH DESACTIVADA"}
						</span>
					</div>
					<p style={{ fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px" }}>
						Controla si el bridge MCP exige API Key para /sse, /messages y tools.
					</p>
					<button
						onClick={handleToggleMcp}
						disabled={mcpUpdating}
						className="btn-primary"
						style={{ width: "100%", justifyContent: "center", display: "flex", gap: "8px" }}
					>
						<PlugZap size={14} /> {mcpUpdating ? "Actualizando..." : mcpAuthEnabled ? "Deshabilitar MCP Auth" : "Habilitar MCP Auth"}
					</button>

					<div
						style={{
							marginTop: "12px",
							fontFamily: "var(--font-mono)",
							fontSize: "11px",
							color: "var(--text-muted)",
							display: "flex",
							flexDirection: "column",
							gap: "4px",
						}}
					>
						<span>SSE: {mcpSseUrl}</span>
						<span>Messages: {mcpMessagesUrl}</span>
					</div>
				</div>
			</div>

			{message && (
				<div
					className="card-glass"
					style={{
						padding: "12px 16px",
						fontSize: "12px",
						color: message.toLowerCase().includes("no se pudo") ? "var(--error)" : "var(--success)",
					}}
				>
					{message}
				</div>
			)}
		</div>
	);
};
