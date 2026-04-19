import { useEffect, useState, useRef } from "react";
import { api } from "../services/api.service";

export default function PerformanceMetrics() {
	const [metrics, setMetrics] = useState<any>(null);
	const [loading, setLoading] = useState(false);
	const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

	useEffect(() => {
		const fetchMetrics = async () => {
			setLoading(true);
			try {
				const res = await api.get("/api/metrics/performance");
				setMetrics(res.data);
			} catch (error) {
				console.error("Failed to fetch metrics:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchMetrics();
		refreshIntervalRef.current = setInterval(fetchMetrics, 30000); // Refresh every 30s

		return () => {
			if (refreshIntervalRef.current) {
				clearInterval(refreshIntervalRef.current);
			}
		};
	}, []);

	if (loading || !metrics) {
		return <div style={{ padding: "10px", color: "#999" }}>Cargando métricas...</div>;
	}

	return (
		<div style={{
			border: "1px solid #444",
			borderRadius: "8px",
			padding: "15px",
			backgroundColor: "#1e1e1e",
			fontFamily: "monospace",
			fontSize: "12px",
			color: "#e0e0e0"
		}}>
			<h3 style={{ margin: "0 0 10px 0", color: "#4CAF50" }}>⚡ Performance Metrics</h3>

			{/* TTFT Section */}
			<div style={{ marginBottom: "15px" }}>
				<div style={{ color: "#FFB74D", fontWeight: "bold", marginBottom: "5px" }}>
					TTFT (Time to First Token)
				</div>
				<div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", paddingLeft: "10px" }}>
					<div>
						<span style={{ color: "#999" }}>Avg:</span> {metrics.ttft.avg}ms
					</div>
					<div>
						<span style={{ color: "#999" }}>P95:</span> {metrics.ttft.p95}ms
					</div>
					<div>
						<span style={{ color: "#999" }}>Max:</span> {metrics.ttft.max}ms
					</div>
				</div>
				<div style={{ color: "#666", fontSize: "11px", marginTop: "5px", paddingLeft: "10px" }}>
					Samples: {metrics.ttft.samples}
				</div>
			</div>

			{/* Throughput Section */}
			<div style={{ marginBottom: "15px" }}>
				<div style={{ color: "#FFB74D", fontWeight: "bold", marginBottom: "5px" }}>
					Throughput
				</div>
				<div style={{ paddingLeft: "10px" }}>
					<div>
						<span style={{ color: "#999" }}>Avg Tokens/sec:</span> {metrics.throughput.avgTokensPerSec}
					</div>
					<div style={{ color: "#666", fontSize: "11px", marginTop: "5px" }}>
						Samples: {metrics.throughput.samples}
					</div>
				</div>
			</div>

			{/* Timestamp */}
			<div style={{ color: "#666", fontSize: "11px", marginTop: "10px", borderTop: "1px solid #333", paddingTop: "10px" }}>
				Actualizado: {new Date(metrics.timestamp).toLocaleTimeString("es-AR")}
			</div>
		</div>
	);
}
