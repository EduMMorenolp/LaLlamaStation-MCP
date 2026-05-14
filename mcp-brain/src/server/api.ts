import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import cors from "cors";
import express from "express";
import type { DatabaseService } from "../database/connection.js";
import { analysis, memories, settings } from "../services/index.js";

const PORT = process.env.BRAIN_PORT || 3001;

export function startApiServer(dbService: DatabaseService) {
	const app = express();
	app.use(cors());
	app.use(express.json());

	// Auto-Sync MCP
	app.post("/api/mcp/sync", async (req, res) => {
		const { target } = req.body;
		try {
			const ollamaUrl = process.env.OLLAMA_API_URL || "http://127.0.0.1:11434";
			const brainPort = process.env.BRAIN_PORT || "3001";
			const scriptPath = path.resolve(process.cwd(), "src/index.ts").replace(/\\/g, "/");

			const mcpConfigBlock = {
				command: "npx",
				args: ["tsx", scriptPath],
				env: {
					OLLAMA_API_URL: ollamaUrl,
					BRAIN_PORT: brainPort,
				},
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

			if (target === "opencode") {
				const openCodePath = path.resolve(process.cwd(), "../opencode.json");
				if (fs.existsSync(openCodePath)) {
					const configData = JSON.parse(fs.readFileSync(openCodePath, "utf8"));
					configData.mcp = configData.mcp || {};
					configData.mcp["lallamastation-brain"] = {
						type: "local",
						...mcpConfigBlock,
						enabled: true,
					};
					fs.writeFileSync(openCodePath, JSON.stringify(configData, null, 2), "utf8");
					return res.json({
						success: true,
						message: "¡Configuración de OpenCode AI sincronizada con éxito!",
					});
				} else {
					return res
						.status(404)
						.json({ error: "No se encontró el archivo opencode.json en la raíz del proyecto." });
				}
			} else if (target === "antigravity") {
				const agPath = path.join(os.homedir(), ".gemini/antigravity/mcp_config.json");
				updateMcpFile(agPath, "lallamastation-brain", mcpConfigBlock);
				return res.json({
					success: true,
					message: "¡Motor Antigravity AI supercargado y sincronizado con éxito!",
				});
			} else if (target === "claudedesktop") {
				const cdPath = path.join(os.homedir(), "AppData/Roaming/Claude/claude_desktop_config.json");
				updateMcpFile(cdPath, "lallamastation-brain", mcpConfigBlock);
				return res.json({ success: true, message: "¡Claude Desktop sincronizado con éxito!" });
			} else if (target === "roocode") {
				const rooPath = path.join(
					os.homedir(),
					"AppData/Roaming/Code/User/globalStorage/saoudrizwan.claude-dev/settings/claude_desktop_config.json"
				);
				updateMcpFile(rooPath, "lallamastation-brain", mcpConfigBlock);
				return res.json({ success: true, message: "¡RooCode / Cline sincronizado con éxito en VS Code!" });
			} else if (target === "cursor" || target === "claudecode" || target === "windsurf") {
				return res.json({
					success: true,
					message: `¡Copia y pega este bloque en los ajustes de ${target.toUpperCase()}:`,
					config: { "lallamastation-brain": mcpConfigBlock },
				});
			} else {
				return res.status(400).json({ error: "Destino no soportado." });
			}
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.get("/api/memory/stats", async (req, res) => {
		const project = (req.query.project as string) || "lallamastation";
		try {
			const stats = await memories.getStats(dbService, project);
			res.json(stats);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.get("/api/memory/search", async (req, res) => {
		const q = (req.query.q as string) || "";
		const project = (req.query.project as string) || "lallamastation";
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
				new Set(["lallamastation", ...rows.map((r: { project: string }) => r.project)])
			);
			res.json(projects);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	// Directives
	app.get("/api/directives", async (req, res) => {
		const project = (req.query.project as string) || "lallamastation";
		try {
			const content = await settings.getCoreDirectives(dbService, project);
			res.json({ project, content });
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	app.post("/api/directives", async (req, res) => {
		const { project = "lallamastation", content } = req.body;
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
		const project = (req.body.project as string) || "lallamastation";
		try {
			const result = await analysis.consolidateMemories(dbService, project);
			res.json(result);
		} catch (e: unknown) {
			res.status(500).json({ error: e instanceof Error ? e.message : String(e) });
		}
	});

	const serverInstance = app.listen(PORT, () => {
		console.error(`[Brain UI API] Dashboard API listening on port ${PORT}`);
	});

	serverInstance.on("error", (err: Error) => {
		if (err.code === "EADDRINUSE") {
			console.error(`[Brain UI API] Warning: Port ${PORT} already in use. Running in Stdio-only mode.`);
		} else {
			console.error(`[Brain UI API] Server error:`, err);
		}
	});
}
