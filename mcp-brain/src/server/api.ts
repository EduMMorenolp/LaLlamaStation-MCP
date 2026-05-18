import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import cors from "cors";
import express from "express";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import type { DatabaseService } from "../database/connection.js";
import { analysis, memories, settings, templates } from "../services/index.js";
import { createMcpServer } from "./mcp.js";

const PORT = process.env.BRAIN_PORT || 3015;

export function startApiServer(dbService: DatabaseService) {
	const app = express();
	app.use(cors());
	app.use(express.json());

	// Auto-Sync MCP (SSE / Docker-based)
	app.post("/api/mcp/sync", async (req, res) => {
		const { target } = req.body;
		try {
			const brainPort = process.env.BRAIN_PORT || "3015";
			const hostIp = process.env.HOST_IP || "localhost";
			const sseUrl = `http://${hostIp}:${brainPort}/sse`;

			// --- Config SSE para cada herramienta ---

			// OpenCode AI usa schema propio con "type": "remote"
			const openCodeSseConfig = {
				type: "remote",
				url: sseUrl,
			};

			// Claude Desktop / RooCode / Antigravity usan schema estandar con "type": "url"
			const claudeCompatSseConfig = {
				type: "url",
				url: sseUrl,
			};

			const updateMcpFile = (filePath: string, serverKey: string, configObj: Record<string, unknown>) => {
				const dir = path.dirname(filePath);
				if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
				let data: { mcpServers?: Record<string, unknown> } = { mcpServers: {} };
				if (fs.existsSync(filePath)) {
					try {
						data = JSON.parse(fs.readFileSync(filePath, "utf8"));
					} catch {
						data = { mcpServers: {} };
					}
				}
				data.mcpServers = data.mcpServers || {};
				data.mcpServers[serverKey] = configObj;
				fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
			};

			// Antigravity usa Docker stdio para evitar problemas de certificados/HTTPS
			const hostProjectPath = process.env.HOST_PROJECT_PATH || "C:/path/to/project";
			const antigravityConfig = {
				command: "docker",
				args: [
					"run",
					"-i",
					"--rm",
					"-e",
					"OLLAMA_API_URL=http://host.docker.internal:11434",
					"--add-host=host.docker.internal:host-gateway",
					"-v",
					`${hostProjectPath}/data:/app/data`,
					"lallamaollama-mcp-brain",
					"node",
					"dist/index.js",
				],
			};

			if (target === "opencode") {
				const openCodePath = path.resolve(process.cwd(), "../opencode.json");
				if (fs.existsSync(openCodePath)) {
					const configData = JSON.parse(fs.readFileSync(openCodePath, "utf8"));
					configData.mcp = configData.mcp || {};
					configData.mcp["lallamaollama-brain"] = openCodeSseConfig;
					fs.writeFileSync(openCodePath, JSON.stringify(configData, null, 2), "utf8");
					return res.json({
						success: true,
						message: "¡Configuración de OpenCode AI sincronizada con éxito! (SSE remoto)",
					});
				} else {
					return res
						.status(404)
						.json({ error: "No se encontró el archivo opencode.json en la raíz del proyecto." });
				}
			} else if (target === "antigravity") {
				const agPath = path.join(os.homedir(), ".gemini/antigravity/mcp_config.json");
				updateMcpFile(agPath, "lallamasollama-brain", antigravityConfig);
				return res.json({
					success: true,
					message: `¡Motor Antigravity AI sincronizado con éxito! (Docker MCP en ${hostProjectPath})`,
				});
			} else if (target === "claudedesktop") {
				const cdPath = path.join(os.homedir(), "AppData/Roaming/Claude/claude_desktop_config.json");
				updateMcpFile(cdPath, "lallamasollama-brain", claudeCompatSseConfig);
				return res.json({
					success: true,
					message: "¡Claude Desktop sincronizado con éxito! (SSE remoto)",
				});
			} else if (target === "roocode") {
				const rooPath = path.join(
					os.homedir(),
					"AppData/Roaming/Code/User/globalStorage/saoudrizwan.claude-dev/settings/claude_desktop_config.json"
				);
				updateMcpFile(rooPath, "lallamasollama-brain", claudeCompatSseConfig);
				return res.json({
					success: true,
					message: "¡RooCode / Cline sincronizado con éxito en VS Code! (SSE remoto)",
				});
			} else if (target === "cursor" || target === "claudecode") {
				return res.json({
					success: true,
					message: `¡Copia y pega este bloque en los ajustes de ${target.toUpperCase()}:`,
					config: { "lallamasollama-brain": claudeCompatSseConfig },
				});
			} else if (target === "windsurf") {
				return res.json({
					success: true,
					message: "¡Copia y pega este bloque en los ajustes de WINDSURF:",
					config: { "lallamasollama-brain": claudeCompatSseConfig },
				});
			} else {
				return res.status(400).json({ error: "Destino no soportado." });
			}
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.get("/api/memory/stats", async (req, res) => {
		const project = (req.query.project as string) || "lallamasollama";
		try {
			const stats = await memories.getStats(dbService, project);
			res.json(stats);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.get("/api/memory/search", async (req, res) => {
		const q = (req.query.q as string) || "";
		const project = (req.query.project as string) || "lallamasollama";
		const mode = (req.query.mode as "lexical" | "semantic" | "hybrid") || "hybrid";
		try {
			const results =
				q.trim() === ""
					? await memories.getContext(dbService, project, 50)
					: await memories.searchMemories(dbService, q, project, mode, 50);
			res.json(results);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.delete("/api/memory/:id", async (req, res) => {
		try {
			const success = await memories.deleteMemory(dbService, req.params.id);
			if (success) res.json({ message: "Memory deleted" });
			else res.status(404).json({ error: "Memory not found" });
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	// Projects
	app.get("/api/projects", async (_req, res) => {
		try {
			const db = dbService.getDb();
			const rows = await db.all(`
				SELECT DISTINCT project FROM memories 
				UNION 
				SELECT DISTINCT project FROM core_directives
			`);
			const projects = Array.from(
				new Set(["lallamasollama", ...rows.map((r: { project: string }) => r.project)])
			);
			res.json(projects);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.delete("/api/projects/:name", async (req, res) => {
		const projectName = req.params.name;
		if (projectName === "lallamasollama") {
			return res.status(403).json({ error: "No se puede eliminar el proyecto principal." });
		}
		try {
			const result = await memories.deleteProject(dbService, projectName);
			res.json({
				success: true,
				message: `Proyecto "${projectName}" eliminado correctamente.`,
				deletedMemories: result.deletedMemories,
				deletedDirectives: result.deletedDirectives,
			});
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	// Directives
	app.get("/api/directives", async (req, res) => {
		const project = (req.query.project as string) || "lallamasollama";
		try {
			const content = await settings.getCoreDirectives(dbService, project);
			res.json({ project, content });
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.post("/api/directives", async (req, res) => {
		const { project = "lallamasollama", content } = req.body;
		try {
			await settings.updateCoreDirectives(dbService, project, content || "");
			res.json({ success: true });
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	// Settings
	app.get("/api/settings/:key", async (req, res) => {
		try {
			const value = await settings.getGlobalSetting(dbService, req.params.key);
			res.json({ key: req.params.key, value });
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.post("/api/settings", async (req, res) => {
		const { key, value } = req.body;
		try {
			await settings.updateGlobalSetting(dbService, key, value);
			res.json({ success: true });
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	// Consolidation
	app.post("/api/memory/consolidate", async (req, res) => {
		const project = (req.body.project as string) || "lallamasollama";
		try {
			const result = await analysis.consolidateMemories(dbService, project);
			res.json(result);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	// ─── Templates ────────────────────────────────────────────────────────────

	app.get("/api/templates", async (req, res) => {
		const tool = req.query.tool as string | undefined;
		const type = req.query.type as string | undefined;
		try {
			const list = await templates.listTemplates(dbService, tool, type);
			res.json(list);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.get("/api/templates/:id", async (req, res) => {
		try {
			const tpl = await templates.getTemplate(dbService, req.params.id);
			if (!tpl) return res.status(404).json({ error: "Template not found" });
			res.json(tpl);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.post("/api/templates", async (req, res) => {
		const { tool, type, name, description, content, variables, output_path } = req.body;
		if (!tool || !type || !name || !content) {
			return res.status(400).json({ error: "tool, type, name y content son obligatorios" });
		}
		try {
			const tpl = await templates.saveTemplate(dbService, {
				tool, type, name, description, content, variables, output_path,
			});
			res.status(201).json(tpl);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.put("/api/templates/:id", async (req, res) => {
		try {
			const tpl = await templates.updateTemplate(dbService, req.params.id, req.body);
			if (!tpl) return res.status(404).json({ error: "Template not found" });
			res.json(tpl);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.delete("/api/templates/:id", async (req, res) => {
		try {
			const result = await templates.deleteTemplate(dbService, req.params.id);
			if (result.protected) return res.status(403).json({ error: "Los templates del sistema no pueden eliminarse." });
			if (!result.deleted) return res.status(404).json({ error: "Template not found" });
			res.json({ success: true });
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.post("/api/templates/:id/render", async (req, res) => {
		try {
			const tpl = await templates.getTemplate(dbService, req.params.id);
			if (!tpl) return res.status(404).json({ error: "Template not found" });
			const result = templates.renderTemplate(tpl, req.body.variables || {});
			res.json(result);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	// Endpoint para acceso remoto vía HTTP/SSE
	app.get("/mcp", (_req, res) => {
		res.json({ status: "ok", message: "LaLlamaOllama Brain MCP Server", timestamp: new Date().toISOString() });
	});

	// --- MCP SSE Transport (Multi-Sesión) ---
	// Cada conexión SSE crea su propio Server+Transport para soportar múltiples clientes simultáneos

	interface SseSession {
		server: ReturnType<typeof createMcpServer>;
		transport: SSEServerTransport;
	}
	const sseSessions = new Map<string, SseSession>();

	// Health check endpoint
	app.get("/health", async (_req, res) => {
		try {
			res.json({ 
				status: "healthy", 
				server: "LaLlamaStation Brain MCP",
				timestamp: new Date().toISOString(),
				uptime: process.uptime(),
				memoryUsage: process.memoryUsage(),
				activeSessions: sseSessions.size
			});
		} catch (err: unknown) {
			res.status(500).json({ status: "unhealthy", error: err instanceof Error ? err.message : String(err) });
		}
	});

	app.get("/sse", async (req, res) => {
		let transport: SSEServerTransport | undefined;
		let server: ReturnType<typeof createMcpServer> | undefined;
		try {
			console.error(`[Brain MCP SSE] ✅ GET /sse - Nueva conexión recibida`);
			
			transport = new SSEServerTransport("/messages", res);
			console.error(`[Brain MCP SSE] ✅ Transport creado: sessionId=${transport.sessionId}`);
			
			server = createMcpServer(dbService);
			sseSessions.set(transport.sessionId, { server, transport });
			console.error(`[Brain MCP SSE] ✅ Sesión registrada: sessionId=${transport.sessionId}`);
			
			res.on("close", () => {
				console.error(`[Brain MCP SSE] ⚠️  Conexión cerrada: ${transport?.sessionId}`);
				if (transport?.sessionId) {
					sseSessions.delete(transport.sessionId);
				}
				server?.close().catch((err: unknown) => 
					console.error(`[Brain MCP SSE] Error al cerrar servidor:`, err)
				);
			});
			
			console.error(`[Brain MCP SSE] ✅ Iniciando conexión del servidor MCP...`);
			await server.connect(transport);
			console.error(`[Brain MCP SSE] ✅ Servidor MCP conectado exitosamente (sessionId=${transport.sessionId})`);
		} catch (err: unknown) {
			const error = err instanceof Error ? err.message : String(err);
			const stack = err instanceof Error ? err.stack : "";
			console.error(`[Brain MCP SSE] ❌ ERROR EN /sse:`, error);
			console.error(`[Brain MCP SSE] Stack trace:`, stack);
			
			if (transport?.sessionId) {
				sseSessions.delete(transport.sessionId);
			}
			if (server) {
				server.close().catch(() => {});
			}
			
			if (!res.headersSent) {
				res.status(500).json({ 
					error: "SSE Connection Failed", 
					details: error,
					timestamp: new Date().toISOString()
				});
			}
		}
	});

	app.post("/messages", async (req, res) => {
		try {
			const sessionId = req.query.sessionId as string;
			console.error(`[Brain MCP SSE] POST /messages - sessionId: ${sessionId}`);
			
			const session = sessionId ? sseSessions.get(sessionId) : undefined;
			if (session) {
				console.error(`[Brain MCP SSE] ✅ Sesión encontrada, procesando mensaje...`);
				await session.transport.handlePostMessage(req, res, req.body);
			} else {
				console.error(`[Brain MCP SSE] ❌ No hay sesión SSE activa para: ${sessionId}`);
				res.status(400).json({ error: "No active SSE session", sessionId, availableSessions: Array.from(sseSessions.keys()) });
			}
		} catch (err: unknown) {
			const error = err instanceof Error ? err.message : String(err);
			console.error(`[Brain MCP SSE] ❌ ERROR EN /messages:`, error);
			if (!res.headersSent) {
				res.status(500).json({ error: "Message processing failed", details: error });
			}
		}
	});

	const serverInstance = app.listen(PORT, () => {
		console.error(`\n╔════════════════════════════════════════════════════════════╗`);
		console.error(`║     LaLlamaStation Brain MCP Server - Iniciado            ║`);
		console.error(`╚════════════════════════════════════════════════════════════╝`);
		console.error(`📊 Dashboard API listening on port ${PORT}`);
		console.error(`✅ MCP Health Check: http://localhost:${PORT}/health`);
		console.error(`✅ MCP Status: http://localhost:${PORT}/mcp`);
		console.error(`🌊 SSE Endpoint (Clients): http://localhost:${PORT}/sse`);
		console.error(`💬 Messages Endpoint: http://localhost:${PORT}/messages`);
		console.error(`📈 Memory Stats: http://localhost:${PORT}/api/memory/stats`);
		console.error(`🔍 Memory Search: http://localhost:${PORT}/api/memory/search?q=query`);
		console.error(`\n`);
	});

	serverInstance.on("error", (err: NodeJS.ErrnoException) => {
		if (err.code === "EADDRINUSE") {
			console.error(`\n❌ [ERROR] Puerto ${PORT} ya está en uso.`);
			console.error(`   Asegúrate de que no hay otro proceso usando ese puerto.`);
			console.error(`   O cambia BRAIN_PORT en tu .env file.\n`);
		} else {
			console.error(`\n❌ [ERROR] Error del servidor:`, err);
			console.error(`\n`);
		}
	});
}
