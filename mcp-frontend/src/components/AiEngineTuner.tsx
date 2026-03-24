import axios from "axios";
import {
	AlertTriangle,
	Award,
	BarChart2,
	Clock,
	Cpu,
	DollarSign,
	RefreshCw,
	Save,
	Thermometer,
	TrendingUp,
	Zap,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";

const API = import.meta.env.VITE_API_URL || "http://localhost:3000";
const HEADERS = () => ({ "x-api-key": localStorage.getItem("llama_master_key") || "" });

// USD/ARS reference (approximate)
const USD_TO_ARS = 1200;

function formatTokens(n: number): string {
	if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`;
	if (n >= 1_000) return `${(n / 1000).toFixed(1)}K`;
	return n.toString();
}

function GaugeRing({
	value,
	max,
	color,
	label,
	unit,
}: {
	value: number;
	max: number;
	color: string;
	label: string;
	unit: string;
}) {
	const pct = Math.min(value / max, 1);
	const r = 36;
	const circ = 2 * Math.PI * r;
	const dash = pct * circ;
	return (
		<div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
			<svg width="100" height="100" viewBox="0 0 100 100">
				<circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
				<circle
					cx="50"
					cy="50"
					r={r}
					fill="none"
					stroke={color}
					strokeWidth="8"
					strokeDasharray={`${dash} ${circ}`}
					strokeLinecap="round"
					transform="rotate(-90 50 50)"
					style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: "stroke-dasharray 0.5s ease" }}
				/>
				<text
					x="50"
					y="46"
					textAnchor="middle"
					fill="white"
					fontSize="14"
					fontWeight="800"
					fontFamily="monospace"
				>
					{value.toFixed(value < 10 ? 1 : 0)}
				</text>
				<text x="50" y="60" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="9">
					{unit}
				</text>
			</svg>
			<span
				style={{
					fontSize: "10px",
					color: "rgba(255,255,255,0.5)",
					textTransform: "uppercase",
					letterSpacing: "1px",
				}}
			>
				{label}
			</span>
		</div>
	);
}

import type { EngineStats, StatusResponse } from "../types/api";

interface AiEngineTunerProps {
	status: StatusResponse;
}

export const AiEngineTuner: React.FC<AiEngineTunerProps> = ({ status }) => {
\tconst [engineData, setEngineData] = useState<EngineStats | null>(null);
	const [rateARS, setRateARS] = useState(150);
	const [cloudPrice, setCloudPrice] = useState(5.0);
	const [saving, setSaving] = useState(false);
	const [savedMsg, setSavedMsg] = useState("");

	const fetchEngineStats = useCallback(async () => {
		try {
			const res = await axios.get(`${API}/api/engine-stats`, { headers: HEADERS() });
			setEngineData(res.data);
			setRateARS(res.data.stats?.electricityRateARS ?? 150);
			setCloudPrice(res.data.stats?.cloudPricePerMToken ?? 5.0);
		} catch {}
	}, []);

	useEffect(() => {
		fetchEngineStats();
		const interval = setInterval(fetchEngineStats, 10000); // refresh cada 10s
		return () => clearInterval(interval);
	}, [fetchEngineStats]);

	// También usar datos del status si engine-stats no está disponible aún
	const stats = engineData?.stats || status?.engineStats || {};
	const gpu = engineData?.gpu || status?.gpu || {};

	const totalTokens = (stats.totalInputTokens || 0) + (stats.totalOutputTokens || 0);
	const cloudCostUSD = (totalTokens / 1_000_000) * cloudPrice;
	const electricityCostARS = (stats.kwhConsumed || 0) * rateARS;
	const electricityCostUSD = electricityCostARS / USD_TO_ARS;
	const savedUSD = Math.max(0, cloudCostUSD - electricityCostUSD);

	const thermalPct = Math.min((stats.thermalStressScore || 0) / 100, 1) * 100;
	const thermalColor = thermalPct > 70 ? "#ef4444" : thermalPct > 40 ? "#f59e0b" : "#10b981";

	const saveConfig = async () => {
		setSaving(true);
		try {
			await Promise.all([
				axios.post(`${API}/api/engine-stats/electricity-rate`, { rateARS }, { headers: HEADERS() }),
				axios.post(
					`${API}/api/engine-stats/cloud-price`,
					{ pricePerMToken: cloudPrice },
					{ headers: HEADERS() }
				),
			]);
			setSavedMsg("✓ Configuracion guardada");
			setTimeout(() => setSavedMsg(""), 3000);
		} catch {
			setSavedMsg("✗ Error al guardar");
		} finally {
			setSaving(false);
		}
	};

	const tempColor = (gpu.temperature || 0) > 85 ? "#ef4444" : (gpu.temperature || 0) > 70 ? "#f59e0b" : "#10b981";
	const powerColor = (gpu.powerDraw || 0) > 150 ? "#f59e0b" : "#4f8cff";

	return (
		<div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
			{/* ── GPU Live Metrics ─────────────────────────────── */}
			<div className="card-glass p-8 animate-fade">
				<div className="flex-between" style={{ marginBottom: "24px" }}>
					<h2 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
						<Cpu size={22} style={{ color: "var(--accent)" }} />
						GPU en Tiempo Real
					</h2>
					<button
						onClick={fetchEngineStats}
						style={{
							background: "transparent",
							border: "1px solid var(--border-light)",
							borderRadius: "8px",
							padding: "6px 14px",
							cursor: "pointer",
							color: "var(--text-muted)",
							fontSize: "11px",
							display: "flex",
							alignItems: "center",
							gap: "6px",
						}}
					>
						<RefreshCw size={12} /> Actualizar
					</button>
				</div>

				{!gpu.vram?.available ? (
					<div
						style={{
							padding: "20px",
							background: "rgba(245,158,11,0.06)",
							border: "1px solid rgba(245,158,11,0.2)",
							borderRadius: "12px",
							display: "flex",
							gap: "12px",
							alignItems: "center",
						}}
					>
						<AlertTriangle size={18} style={{ color: "#f59e0b", flexShrink: 0 }} />
						<div>
							<p style={{ fontWeight: 700, color: "#f59e0b", fontSize: "13px" }}>
								nvidia-smi no detectado
							</p>
							<p style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
								Modo CPU-only. Las metricas de GPU, temperatura y consumo no estan disponibles. Los
								contadores de tokens si funcionan.
							</p>
						</div>
					</div>
				) : (
					<div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: "16px" }}>
						<GaugeRing value={gpu.powerDraw || 0} max={300} color={powerColor} label="Consumo" unit="W" />
						<GaugeRing
							value={gpu.temperature || 0}
							max={100}
							color={tempColor}
							label="Temperatura"
							unit="°C"
						/>
						<GaugeRing value={gpu.fanSpeed || 0} max={100} color="#818cf8" label="Fan Speed" unit="%" />
						<GaugeRing value={gpu.gpuUtil || 0} max={100} color="var(--accent)" label="GPU Util" unit="%" />
						<GaugeRing
							value={gpu.vram?.used || 0}
							max={gpu.vram?.total || 1}
							color="#10b981"
							label="VRAM Uso"
							unit="MB"
						/>
					</div>
				)}

				{/* Alerta termica */}
				{(gpu.temperature || 0) >= 80 && (
					<div
						style={{
							marginTop: "16px",
							padding: "12px 16px",
							background: "rgba(239,68,68,0.1)",
							border: "1px solid rgba(239,68,68,0.3)",
							borderRadius: "8px",
							display: "flex",
							gap: "8px",
							alignItems: "center",
						}}
					>
						<AlertTriangle size={16} style={{ color: "var(--error)" }} />
						<span style={{ fontSize: "12px", color: "var(--error)", fontWeight: 700 }}>
							{(gpu.temperature || 0) >= 90
								? `CRITICO: ${gpu.temperature}°C — Unload automatico activado`
								: `AVISO: ${gpu.temperature}°C — Cerca del limite. Considera reducir la carga.`}
						</span>
					</div>
				)}
			</div>

			{/* ── Token Counter & Savings ──────────────────────── */}
			<div className="card-glass p-8 animate-fade">
				<h2 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "24px" }}>
					<DollarSign size={22} style={{ color: "var(--accent)" }} />
					Contador de Tokens & Ahorro vs Cloud
				</h2>

				{/* KPIs de tokens */}
				<div
					style={{
						display: "grid",
						gridTemplateColumns: "repeat(4, 1fr)",
						gap: "12px",
						marginBottom: "24px",
					}}
				>
					{[
						{
							label: "Tokens Entrada",
							value: formatTokens(stats.totalInputTokens || 0),
							icon: "⬇",
							color: "var(--text-main)",
						},
						{
							label: "Tokens Salida",
							value: formatTokens(stats.totalOutputTokens || 0),
							icon: "⬆",
							color: "var(--accent)",
						},
						{ label: "Total Procesado", value: formatTokens(totalTokens), icon: "∑", color: "#10b981" },
						{
							label: "Sesiones",
							value: (stats.sessionCount || 0).toString(),
							icon: "💬",
							color: "#818cf8",
						},
					].map((kpi) => (
						<div
							key={kpi.label}
							style={{
								padding: "14px",
								background: "rgba(255,255,255,0.02)",
								border: "1px solid var(--border-light)",
								borderRadius: "10px",
								textAlign: "center",
							}}
						>
							<p style={{ fontSize: "22px", marginBottom: "4px" }}>{kpi.icon}</p>
							<p
								style={{
									fontSize: "18px",
									fontWeight: 800,
									fontFamily: "var(--font-mono)",
									color: kpi.color,
								}}
							>
								{kpi.value}
							</p>
							<p
								style={{
									fontSize: "9px",
									color: "var(--text-muted)",
									marginTop: "4px",
									textTransform: "uppercase",
									letterSpacing: "1px",
								}}
							>
								{kpi.label}
							</p>
						</div>
					))}
				</div>

				{/* Panel de Comparacion Local vs Cloud */}
				<div
					style={{
						background: "rgba(16,185,129,0.04)",
						border: "1px solid rgba(16,185,129,0.2)",
						borderRadius: "12px",
						overflow: "hidden",
					}}
				>
					<div
						style={{
							padding: "14px 20px",
							background: "rgba(16,185,129,0.08)",
							borderBottom: "1px solid rgba(16,185,129,0.15)",
							display: "flex",
							alignItems: "center",
							gap: "8px",
						}}
					>
						<Award size={16} style={{ color: "#10b981" }} />
						<span style={{ fontSize: "12px", fontWeight: 800, color: "#10b981", letterSpacing: "1px" }}>
							BALANCE — LOCAL vs CLOUD
						</span>
					</div>
					<table style={{ width: "100%", borderCollapse: "collapse" }}>
						<thead>
							<tr style={{ borderBottom: "1px solid var(--border-light)" }}>
								{["Metrica", "LaLlamaStation 🦙", "Cloud (OpenAI/DeepSeek)"].map((h) => (
									<th
										key={h}
										style={{
											padding: "10px 16px",
											textAlign: "left",
											fontSize: "10px",
											color: "var(--text-muted)",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: "1px",
										}}
									>
										{h}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{[
								{
									metric: "Tokens Totales",
									local: formatTokens(totalTokens),
									cloud: `~$${cloudCostUSD.toFixed(2)} USD`,
								},
								{
									metric: "Costo Electricidad",
									local: `~$${electricityCostUSD.toFixed(3)} USD (${electricityCostARS.toFixed(1)} ARS)`,
									cloud: "$0.00",
								},
								{
									metric: "Horas de Inferencia",
									local: `${(stats.inferenceHours || 0).toFixed(2)}h`,
									cloud: "N/A",
								},
								{
									metric: "kWh Consumidos",
									local: `${(stats.kwhConsumed || 0).toFixed(4)} kWh`,
									cloud: "—",
								},
							].map((row, i) => (
								<tr
									key={row.metric}
									style={{
										borderBottom: "1px solid rgba(255,255,255,0.03)",
										background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)",
									}}
								>
									<td style={{ padding: "10px 16px", fontSize: "12px", color: "var(--text-dim)" }}>
										{row.metric}
									</td>
									<td
										style={{
											padding: "10px 16px",
											fontSize: "12px",
											fontWeight: 700,
											color: "var(--text-main)",
											fontFamily: "var(--font-mono)",
										}}
									>
										{row.local}
									</td>
									<td style={{ padding: "10px 16px", fontSize: "12px", color: "var(--text-muted)" }}>
										{row.cloud}
									</td>
								</tr>
							))}
							{/* Fila de balance final */}
							<tr style={{ background: "rgba(16,185,129,0.08)" }}>
								<td
									style={{
										padding: "12px 16px",
										fontWeight: 800,
										fontSize: "13px",
										color: "#10b981",
									}}
								>
									BALANCE FINAL
								</td>
								<td colSpan={2} style={{ padding: "12px 16px" }}>
									<span
										style={{
											fontSize: "16px",
											fontWeight: 800,
											color: "#10b981",
											fontFamily: "var(--font-mono)",
										}}
									>
										+${savedUSD.toFixed(2)} USD ahorrados
									</span>
									<span style={{ fontSize: "11px", color: "var(--text-muted)", marginLeft: "8px" }}>
										vs pagar la API de OpenAI
									</span>
								</td>
							</tr>
						</tbody>
					</table>
				</div>
			</div>

			{/* ── Desgaste Termico ─────────────────────────────── */}
			<div className="card-glass p-8 animate-fade">
				<h2 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
					<Thermometer size={22} style={{ color: thermalColor }} />
					Desgaste Termico Acumulado
				</h2>
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", alignItems: "center" }}>
					<div>
						<div
							style={{
								display: "flex",
								justifyContent: "space-between",
								marginBottom: "8px",
								fontSize: "11px",
								color: "var(--text-muted)",
							}}
						>
							<span>Stress Score</span>
							<span style={{ color: thermalColor, fontWeight: 700 }}>
								{stats.thermalStressScore || 0} pts
							</span>
						</div>
						<div
							style={{
								width: "100%",
								height: "10px",
								background: "rgba(255,255,255,0.05)",
								borderRadius: "10px",
								overflow: "hidden",
								marginBottom: "12px",
							}}
						>
							<div
								style={{
									width: `${thermalPct}%`,
									height: "100%",
									background: thermalColor,
									boxShadow: `0 0 10px ${thermalColor}`,
									transition: "width 0.5s ease, background 0.3s",
								}}
							/>
						</div>
						<p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.6" }}>
							Cada minuto sobre 75°C suma 1 punto. Sobre 85°C suma 3 puntos.
							<br />
							Las GPUs modernas toleran bien hasta 83°C en carga sostenida.
						</p>
					</div>
					<div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
						{[
							{
								label: "Horas de Inferencia",
								value: `${(stats.inferenceHours || 0).toFixed(2)}h`,
								icon: <Clock size={14} />,
							},
							{
								label: "Sessions Procesadas",
								value: (stats.sessionCount || 0).toString(),
								icon: <BarChart2 size={14} />,
							},
							{
								label: "kWh Consumidos (est.)",
								value: `${(stats.kwhConsumed || 0).toFixed(4)} kWh`,
								icon: <Zap size={14} />,
							},
						].map((item) => (
							<div
								key={item.label}
								style={{
									display: "flex",
									alignItems: "center",
									gap: "10px",
									padding: "10px 14px",
									background: "rgba(255,255,255,0.02)",
									border: "1px solid var(--border-light)",
									borderRadius: "8px",
								}}
							>
								<span style={{ color: "var(--accent)", opacity: 0.6, flexShrink: 0 }}>{item.icon}</span>
								<span style={{ fontSize: "11px", color: "var(--text-muted)", flex: 1 }}>
									{item.label}
								</span>
								<span style={{ fontSize: "13px", fontWeight: 700, fontFamily: "var(--font-mono)" }}>
									{item.value}
								</span>
							</div>
						))}
					</div>
				</div>
			</div>

			{/* ── Configuracion de Precios ─────────────────────── */}
			<div className="card-glass p-8 animate-fade">
				<h2 style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
					<TrendingUp size={22} style={{ color: "var(--accent)" }} />
					Configuracion de Comparativa
				</h2>
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
					<div>
						<label
							style={{
								fontSize: "11px",
								color: "var(--text-muted)",
								display: "block",
								marginBottom: "8px",
								textTransform: "uppercase",
								letterSpacing: "1px",
							}}
						>
							Tarifa Electrica Local (ARS/kWh)
						</label>
						<input
							type="number"
							min={1}
							step={10}
							value={rateARS}
							onChange={(e) => setRateARS(Number(e.target.value))}
							className="pin-input"
							style={{ textAlign: "left", padding: "12px 16px", fontSize: "14px", letterSpacing: "0" }}
						/>
						<p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
							Berisso/EDELAP: ~120-180 ARS/kWh (2026)
						</p>
					</div>
					<div>
						<label
							style={{
								fontSize: "11px",
								color: "var(--text-muted)",
								display: "block",
								marginBottom: "8px",
								textTransform: "uppercase",
								letterSpacing: "1px",
							}}
						>
							Precio Cloud de Referencia (USD / 1M tokens)
						</label>
						<input
							type="number"
							min={0.1}
							step={0.5}
							value={cloudPrice}
							onChange={(e) => setCloudPrice(Number(e.target.value))}
							className="pin-input"
							style={{ textAlign: "left", padding: "12px 16px", fontSize: "14px", letterSpacing: "0" }}
						/>
						<p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
							GPT-4o: ~$5 | GPT-4o-mini: ~$0.3 | Claude 3.5: ~$3
						</p>
					</div>
				</div>
				<div style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "20px" }}>
					<button
						className="auth-btn"
						disabled={saving}
						style={{ width: "auto", padding: "0 32px", display: "flex", alignItems: "center", gap: "8px" }}
						onClick={saveConfig}
					>
						{saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
						{saving ? "Guardando..." : "Aplicar"}
					</button>
					{savedMsg && (
						<span
							style={{
								fontSize: "12px",
								fontWeight: 700,
								color: savedMsg.startsWith("✓") ? "var(--success)" : "var(--error)",
							}}
						>
							{savedMsg}
						</span>
					)}
				</div>
			</div>
		</div>
	);
};
