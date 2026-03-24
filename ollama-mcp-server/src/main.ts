import { createServer } from "node:http";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import axios from "axios";
import * as cheerio from "cheerio";
import cors from "cors";
import Docker from "dockerode";
import express, { type Request, type Response } from "express";
import { rateLimit } from "express-rate-limit";
import helmet from "helmet";
import { Server as SocketServer } from "socket.io";
import { AppModule } from "./app.module.js";

const app = express();
app.use(cors()); // Habilitar CORS para desarrollo local del frontend

// --- Middleware de Seguridad (Fase 1) ---
app.use(helmet());
const limiter = rateLimit({
	windowMs: 15 * 60 * 1000,
	max: 15000,
	standardHeaders: true,
	legacyHeaders: false,
	skip: (req) => {
		const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
		const isLocal = ip === "::1" || ip === "127.0.0.1" || ip.includes("127.0.0.1");
		const apiKey = req.headers["x-api-key"] || req.headers.authorization?.toString().replace("Bearer ", "");
		const isValidKey = appModule.authService.validate(apiKey as string);
		return isLocal || isValidKey;
	},
});
app.use(limiter);

app.use(express.json());
const port = process.env.APP_PORT || 3000;
const httpServer = createServer(app);
const io = new SocketServer(httpServer, {
	cors: {
		origin: "*", // En producción se debe restringir
	},
});

const server = new Server(
	{
		name: "lallama-station-mcp",
		version: "1.0.0",
	},
	{
		capabilities: {
			tools: {},
		},
	}
);

// Módulo de la aplicación (Estilo NestJS)
const appModule = new AppModule();
appModule.bootstrap(server, io);

// --- Middleware de Seguridad Avanzada (Fase 2) ---
const securityMiddleware = (req: Request, res: Response, next: Function) => {
	const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";

	if (appModule.ollamaService.isBlacklisted(ip)) {
		return res.status(403).json({ error: "Forbidden: Your IP is blacklisted" });
	}
	next();
};

app.use(securityMiddleware);

const authMiddleware = (req: Request, res: Response, next: Function) => {
	const ip = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "unknown";
	const apiKey = req.headers["x-api-key"] || req.headers.authorization?.toString().replace("Bearer ", "");

	const action = `${req.method} ${req.path}`;
	// Omitir logging de endpoints de polling interno para no saturar el panel de seguridad
	const isPolling = req.method === "GET" && ["/api/status", "/api/engine-stats", "/api/hardware"].includes(req.path);

	if (appModule.authService.validate(apiKey as string)) {
		if (!isPolling) {
			appModule.ollamaService.logRequest(ip, action, "Success");
		}
		next();
	} else {
		appModule.ollamaService.logRequest(ip, action, "Unauthorized");
		appModule.ollamaService.reportFailedAuth(ip);
		res.status(401).json({ error: "Unauthorized: Invalid API Key" });
	}
};

// --- Rutas de Compatibilidad OpenAI ---

// 1. Listar modelos (OpenAI Format)
app.get("/v1/models", authMiddleware, async (_req, res) => {
	try {
		const models = await appModule.ollamaService.listModels();
		res.json({
			object: "list",
			data: models.map((m) => ({
				id: m.name,
				object: "model",
				created: Math.floor(Date.now() / 1000),
				owned_by: "ollama",
			})),
		});
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

// 1b. Listar modelos con datos completos (para el Dashboard)
app.get("/api/models", authMiddleware, async (_req, res) => {
	try {
		const models = await appModule.ollamaService.listModels();
		res.json({ models });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

// 2. Chat Completions (OpenAI Format)
app.post("/v1/chat/completions", authMiddleware, async (req, res) => {
	const { model, messages, stream } = req.body;

	try {
		const response = await appModule.ollamaService.chat(model, messages);

		// Simplificado para no-streaming por ahora
		res.json({
			id: `chatcmpl-${Date.now()}`,
			object: "chat.completion",
			created: Math.floor(Date.now() / 1000),
			model: model,
			choices: [
				{
					index: 0,
					message: response,
					finish_reason: "stop",
				},
			],
			usage: {
				prompt_tokens: 0,
				completion_tokens: 0,
				total_tokens: 0,
			},
		});
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

// --- Endpoints de Telemetría y Gestión (Fase 5) ---

app.get("/api/status", authMiddleware, async (_req, res) => {
	try {
		const status = await appModule.ollamaService.getServerStatus();
		res.json(status);
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

app.post("/api/unload", authMiddleware, async (_req, res) => {
	try {
		await appModule.ollamaService.unloadModels();
		res.json({ message: "VRAM freed successfully" });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

app.post("/api/ban", authMiddleware, async (req, res) => {
	const { ip } = req.body;
	if (!ip) return res.status(400).json({ error: "IP is required" });
	appModule.ollamaService.banIp(ip);
	res.json({ message: `IP ${ip} banned` });
});

app.post("/api/unban", authMiddleware, async (req, res) => {
	const { ip } = req.body;
	if (!ip) return res.status(400).json({ error: "IP is required" });
	appModule.ollamaService.unbanIp(ip);
	res.json({ message: `IP ${ip} unbanned` });
});

app.post("/api/pull", authMiddleware, async (req, res) => {
	const { model } = req.body;
	if (!model) return res.status(400).json({ error: "Model is required" });
	try {
		// No esperamos a que termine, pullModel emite via socket el progreso
		appModule.ollamaService.pullModel(model).catch((err) => {
			console.error(`Error pulling model ${model}:`, err);
		});
		res.json({ message: `Pulling model ${model} started` });
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
});

app.post("/api/clean", authMiddleware, async (_req, res) => {
	try {
		const result = await appModule.ollamaService.cleanWorkspace();
		res.json({ message: "Workspace cleaned", freed: result.freed });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

app.delete("/api/models/:name", authMiddleware, async (req, res) => {
	try {
		await appModule.ollamaService.deleteModel(req.params.name);
		res.json({ message: `Model ${req.params.name} deleted` });
	} catch (error: any) {
		res.status(500).json({ error: error.message });
	}
});

// --- Hardware Sentinel ---

app.get("/api/hardware", authMiddleware, (_req, res) => {
	res.json({
		vram: appModule.ollamaService.getVramInfo(),
		autoUnloadMinutes: appModule.ollamaService.getAutoUnload(),
		globalNumCtx: appModule.ollamaService.getGlobalNumCtx(),
	});
});

app.post("/api/hardware/auto-unload", authMiddleware, (req, res) => {
	const { minutes } = req.body;
	if (typeof minutes !== "number" || minutes < 0) {
		return res.status(400).json({ error: "minutes debe ser un numero >= 0 (0 = desactivado)" });
	}
	appModule.ollamaService.setAutoUnload(minutes);
	res.json({
		message: `Auto-unload: ${minutes === 0 ? "desactivado" : `${minutes} min`}`,
		autoUnloadMinutes: minutes,
	});
});

app.post("/api/hardware/num-ctx", authMiddleware, (req, res) => {
	const { numCtx } = req.body;
	if (typeof numCtx !== "number" || numCtx < 512) {
		return res.status(400).json({ error: "numCtx debe ser >= 512" });
	}
	appModule.ollamaService.setGlobalNumCtx(numCtx);
	res.json({ message: `Contexto global: ${numCtx} tokens`, globalNumCtx: numCtx });
});

// --- AI Engine Tuner ---

app.get("/api/engine-stats", authMiddleware, (_req, res) => {
	const stats = appModule.ollamaService.getStats();
	const gpu = appModule.ollamaService.getGpuMetrics();
	res.json({ stats, gpu });
});

app.post("/api/engine-stats/electricity-rate", authMiddleware, (req, res) => {
	const { rateARS } = req.body;
	if (typeof rateARS !== "number" || rateARS < 0) {
		return res.status(400).json({ error: "rateARS debe ser un numero >= 0" });
	}
	appModule.ollamaService.updateElectricityRate(rateARS);
	res.json({ message: `Tarifa actualizada: ${rateARS} ARS/kWh` });
});

app.post("/api/engine-stats/cloud-price", authMiddleware, (req, res) => {
	const { pricePerMToken } = req.body;
	if (typeof pricePerMToken !== "number" || pricePerMToken < 0) {
		return res.status(400).json({ error: "pricePerMToken debe ser >= 0" });
	}
	appModule.ollamaService.updateCloudPrice(pricePerMToken);
	res.json({ message: `Precio cloud actualizado: $${pricePerMToken} USD/1M tokens` });
});

// --- Control de Ngrok via Docker API ---
const docker = new Docker({ socketPath: "/var/run/docker.sock" });
const NGROK_CONTAINER = process.env.NGROK_CONTAINER_NAME || "mcp-ngrok-tunnel";

async function getNgrokContainer() {
	try {
		return docker.getContainer(NGROK_CONTAINER);
	} catch {
		return null;
	}
}

app.get("/api/ngrok/status", authMiddleware, async (_req, res) => {
	try {
		const container = await getNgrokContainer();
		if (!container) return res.json({ running: false, url: null });
		const info = await container.inspect();
		const running = info.State?.Running === true;
		// Si está corriendo, intentar obtener la URL del tunnel
		let url: string | null = null;
		if (running) {
			try {
				const ngrokRes = await axios.get("http://mcp-ngrok-tunnel:4040/api/tunnels", { timeout: 2000 });
				url = ngrokRes.data?.tunnels?.[0]?.public_url || null;
			} catch {
				/* tunnel aún iniciando */
			}
		}
		res.json({ running, url });
	} catch (e: any) {
		res.json({ running: false, url: null, error: e.message });
	}
});

app.post("/api/ngrok/start", authMiddleware, async (_req, res) => {
	try {
		const container = await getNgrokContainer();
		if (!container)
			return res.status(404).json({ error: "Contenedor ngrok no encontrado. Verifica docker-compose." });
		const info = await container.inspect();
		if (info.State?.Running) return res.json({ message: "Ngrok ya está corriendo", running: true });
		await container.start();
		console.log("[ngrok] Tunel iniciado manualmente desde el Dashboard");
		res.json({ message: "Ngrok iniciado", running: true });
	} catch (e: any) {
		res.status(500).json({ error: e.message });
	}
});

app.post("/api/ngrok/stop", authMiddleware, async (_req, res) => {
	try {
		const container = await getNgrokContainer();
		if (!container) return res.status(404).json({ error: "Contenedor ngrok no encontrado" });
		const info = await container.inspect();
		if (!info.State?.Running) return res.json({ message: "Ngrok ya está detenido", running: false });
		await container.stop();
		console.log("[ngrok] Tunel detenido manualmente desde el Dashboard");
		res.json({ message: "Ngrok detenido", running: false });
	} catch (e: any) {
		res.status(500).json({ error: e.message });
	}
});

// --- Control de Ollama Motor via Docker API ---
const OLLAMA_CONTAINER = "mcp-ollama-motor";

async function getOllamaContainer() {
	try {
		return docker.getContainer(OLLAMA_CONTAINER);
	} catch {
		return null;
	}
}

app.post("/api/ollama/start", authMiddleware, async (_req, res) => {
	try {
		const container = await getOllamaContainer();
		if (!container) return res.status(404).json({ error: "Contenedor Ollama no encontrado." });
		await container.start();
		res.json({ message: "Motor Ollama iniciado" });
	} catch (e: any) {
		res.status(500).json({ error: e.message });
	}
});

app.post("/api/ollama/stop", authMiddleware, async (_req, res) => {
	try {
		const container = await getOllamaContainer();
		if (!container) return res.status(404).json({ error: "Contenedor Ollama no encontrado." });
		await container.stop();
		res.json({ message: "Motor Ollama detenido" });
	} catch (e: any) {
		res.status(500).json({ error: e.message });
	}
});

app.post("/api/ollama/restart", authMiddleware, async (_req, res) => {
	try {
		const container = await getOllamaContainer();
		if (!container) return res.status(404).json({ error: "Contenedor Ollama no encontrado." });
		await container.restart();
		res.json({ message: "Motor Ollama reiniciado" });
	} catch (e: any) {
		res.status(500).json({ error: e.message });
	}
});

// --- Scraper de Ollama Library ---
app.get("/api/search-models", authMiddleware, async (req, res) => {
	const q = (req.query.q as string) || "";
	try {
		const url = `https://ollama.com/library${q ? `?q=${encodeURIComponent(q)}` : ""}`;
		const response = await axios.get(url, {
			timeout: 8000,
			headers: { "User-Agent": "Mozilla/5.0 (compatible; LaLlamaStation-MCP/1.0)" },
		});
		const $ = cheerio.load(response.data);
		const models: any[] = [];

		// Parsear tarjetas de modelos de ollama.com/library
		$('a[href^="/library/"]').each((_, el) => {
			const href = $(el).attr("href") || "";
			const name = href.replace("/library/", "").trim();
			if (!name || name.includes("/")) return;

			const title = $(el).find("h2, [class*='title'], strong").first().text().trim() || name;
			const desc = $(el).find("p, [class*='desc']").first().text().trim();
			const pulls = $(el).find("[class*='pull'],[class*='download']").first().text().trim();
			const tags = $(el)
				.find("[class*='tag'],[class*='size']")
				.map((_, t) => $(t).text().trim())
				.get()
				.filter(Boolean)
				.slice(0, 4);

			if (name && !models.find((m) => m.name === name)) {
				models.push({ name, title, desc, pulls, tags });
			}
		});

		res.json({ models: models.slice(0, 24), query: q, source: url });
	} catch (e: any) {
		res.status(500).json({ error: `Error scraping ollama.com: ${e.message}`, models: [] });
	}
});

// --- Endpoints MCP (SSE) ---

let transport: SSEServerTransport | null = null;

app.get("/sse", async (_req: Request, res: Response) => {
	console.log("New SSE connection");
	transport = new SSEServerTransport("/messages", res);
	await server.connect(transport);
});

app.post("/messages", async (req: Request, res: Response) => {
	if (transport) {
		await transport.handlePostMessage(req, res);
	} else {
		res.status(400).send("No transport active");
	}
});

httpServer.listen(port, () => {
	console.log(`\n🚀 Servidor Híbrido Blindado Iniciado`);
	console.log(`----------------------------------`);
	console.log(`MCP SSE: http://localhost:${port}/sse`);
	console.log(`OpenAI API: http://localhost:${port}/v1`);
	console.log(`WebSockets: Activo`);
	console.log(`----------------------------------\n`);
	console.log(`Utiliza tu API_KEY definida en el .env para autenticarte.`);
});

export { io };
