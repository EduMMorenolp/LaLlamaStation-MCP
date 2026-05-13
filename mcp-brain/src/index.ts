import "dotenv/config";

// --- Validación de Variables de Entorno ---
const validateEnv = () => {
	const cyan = "\x1b[36m";
	const yellow = "\x1b[33m";
	const red = "\x1b[31m";
	const reset = "\x1b[0m";

	// Por ahora el Cerebro tiene valores por defecto para todo (puerto 3001, OLLAMA_API_URL).
	// Agrega aquí las variables que desees exigir en el futuro (ej. "API_KEY").
	const requiredVariables: string[] = [];
	const missing = requiredVariables.filter((key) => !process.env[key] || process.env[key].trim() === "");

	if (missing.length > 0) {
		console.error(`\n${red}❌ [FATAL] Faltan variables de entorno requeridas en el Cerebro:${reset}`);
		missing.forEach((key) => console.error(`   ${yellow}- ${key}${reset}`));
		console.error(
			`\n${cyan}Por favor, define estas variables en tu archivo .env o en el docker-compose.yml${reset}\n`
		);
		process.exit(1);
	}
};
validateEnv();

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import cors from "cors";
import express from "express";

import { DatabaseService } from "./database.js";
import { MemoryService } from "./memory.js";

const PORT = process.env.BRAIN_PORT || 3001;

async function bootstrap() {
	// 1. Iniciar Base de Datos y Memoria
	const dbService = new DatabaseService();
	await dbService.initialize();
	const memoryService = new MemoryService(dbService);

	// 2. Iniciar Servidor MCP (Stdio para agentes locales)
	const mcpServer = new Server(
		{
			name: "lallamastation-brain",
			version: "1.0.0",
		},
		{
			capabilities: { tools: {} },
		}
	);

	let currentProject: string | null = null;

	mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
		return {
			tools: [
				{
					name: "mem_save",
					description: "Save a new memory (decision, bugfix, learning)",
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string" },
							type: { type: "string" },
							title: { type: "string" },
							content: { type: "string" },
							tags: { type: "string" },
						},
						required: ["project", "type", "title", "content"],
					},
				},
				{
					name: "mem_update",
					description: "Update an existing memory",
					inputSchema: {
						type: "object",
						properties: {
							id: { type: "string" },
							title: { type: "string" },
							content: { type: "string" },
							tags: { type: "string" },
						},
						required: ["id"],
					},
				},
				{
					name: "mem_delete",
					description: "Delete a memory",
					inputSchema: {
						type: "object",
						properties: { id: { type: "string" } },
						required: ["id"],
					},
				},
				{
					name: "mem_search",
					description: "Search memories using lexical or semantic hybrid search",
					inputSchema: {
						type: "object",
						properties: {
							query: { type: "string" },
							project: { type: "string" },
							mode: { type: "string", description: "lexical, semantic, hybrid" },
							limit: { type: "number" },
						},
						required: ["query", "project"],
					},
				},
				{
					name: "mem_context",
					description: "Get recent memories for a project",
					inputSchema: {
						type: "object",
						properties: { project: { type: "string" }, limit: { type: "number" } },
						required: ["project"],
					},
				},
				{
					name: "mem_timeline",
					description: "Get chronological timeline of memories",
					inputSchema: {
						type: "object",
						properties: { project: { type: "string" }, limit: { type: "number" } },
						required: ["project"],
					},
				},
				{
					name: "mem_session_start",
					description: "Start a new logical work session",
					inputSchema: {
						type: "object",
						properties: { project: { type: "string" }, name: { type: "string" } },
						required: ["project", "name"],
					},
				},
				{
					name: "mem_session_end",
					description: "End the work session and save summary",
					inputSchema: {
						type: "object",
						properties: { sessionId: { type: "string" }, summary: { type: "string" } },
						required: ["sessionId", "summary"],
					},
				},
				{
					name: "mem_session_summary",
					description: "Get the summary of a specific session",
					inputSchema: {
						type: "object",
						properties: { sessionId: { type: "string" } },
						required: ["sessionId"],
					},
				},
				{
					name: "mem_compare",
					description: "Compare two memories using local LLM",
					inputSchema: {
						type: "object",
						properties: {
							memoryId1: { type: "string" },
							memoryId2: { type: "string" },
							model: { type: "string" },
						},
						required: ["memoryId1", "memoryId2", "model"],
					},
				},
				{
					name: "mem_stats",
					description: "Get statistics about the brain",
					inputSchema: {
						type: "object",
						properties: { project: { type: "string" } },
						required: ["project"],
					},
				},
				{
					name: "mem_suggest_tags",
					description: "Get tag suggestions for a text",
					inputSchema: {
						type: "object",
						properties: {
							title: { type: "string" },
							content: { type: "string" },
							model: { type: "string" },
						},
						required: ["title", "content", "model"],
					},
				},
				{
					name: "mem_get_observation",
					description: "Retrieve a specific memory by ID",
					inputSchema: {
						type: "object",
						properties: { id: { type: "string" } },
						required: ["id"],
					},
				},
				{
					name: "mem_current_project",
					description: "Set or get the active project",
					inputSchema: {
						type: "object",
						properties: { project: { type: "string" } },
					},
				},
				{
					name: "mem_judge",
					description: "Evaluate conflicts between memories using local LLM",
					inputSchema: {
						type: "object",
						properties: {
							project: { type: "string" },
							memoryId: { type: "string" },
							model: { type: "string" },
						},
						required: ["project", "memoryId", "model"],
					},
				},
			],
		};
	});

	mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
		const { name, arguments: args } = request.params;
		try {
			switch (name) {
				case "mem_save": {
					const memory = await memoryService.saveMemory(
						args?.project as string,
						args?.type as string,
						args?.title as string,
						args?.content as string,
						args?.tags as string
					);
					return { content: [{ type: "text", text: `Memory saved successfully. ID: ${memory.id}` }] };
				}
				case "mem_update": {
					const success = await memoryService.updateMemory(
						args?.id as string,
						args?.title as string,
						args?.content as string,
						args?.tags as string
					);
					return { content: [{ type: "text", text: success ? "Memory updated." : "Memory not found." }] };
				}
				case "mem_delete": {
					const success = await memoryService.deleteMemory(args?.id as string);
					return { content: [{ type: "text", text: success ? "Memory deleted." : "Memory not found." }] };
				}
				case "mem_search": {
					const memories = await memoryService.searchMemories(
						args?.query as string,
						args?.project as string,
						(args?.mode as any) || "hybrid",
						(args?.limit as number) || 10
					);
					return { content: [{ type: "text", text: JSON.stringify(memories, null, 2) }] };
				}
				case "mem_context": {
					const memories = await memoryService.getContext(
						args?.project as string,
						(args?.limit as number) || 20
					);
					return { content: [{ type: "text", text: JSON.stringify(memories, null, 2) }] };
				}
				case "mem_get_observation": {
					const memory = await memoryService.getMemory(args?.id as string);
					return {
						content: [{ type: "text", text: memory ? JSON.stringify(memory, null, 2) : "Not found" }],
					};
				}
				case "mem_current_project": {
					if (args?.project) {
						currentProject = args.project as string;
						return { content: [{ type: "text", text: `Active project set to: ${currentProject}` }] };
					}
					return {
						content: [
							{
								type: "text",
								text: currentProject ? `Active project: ${currentProject}` : "No active project set.",
							},
						],
					};
				}
				case "mem_session_start": {
					const id = await memoryService.startSession(args?.project as string, args?.name as string);
					return { content: [{ type: "text", text: `Session started. ID: ${id}` }] };
				}
				case "mem_session_end": {
					const success = await memoryService.endSession(args?.sessionId as string, args?.summary as string);
					return {
						content: [
							{ type: "text", text: success ? "Session ended and summarized." : "Session not found." },
						],
					};
				}
				case "mem_session_summary": {
					const summary = await memoryService.getSessionSummary(args?.sessionId as string);
					return { content: [{ type: "text", text: JSON.stringify(summary, null, 2) }] };
				}
				case "mem_timeline": {
					const timeline = await memoryService.getTimeline(
						args?.project as string,
						(args?.limit as number) || 20
					);
					return { content: [{ type: "text", text: JSON.stringify(timeline, null, 2) }] };
				}
				case "mem_suggest_tags": {
					const tags = await memoryService.suggestTags(
						args?.model as string,
						args?.title as string,
						args?.content as string
					);
					return { content: [{ type: "text", text: tags.join(", ") }] };
				}
				case "mem_judge": {
					const verdict = await memoryService.judgeConflicts(
						args?.model as string,
						args?.project as string,
						args?.memoryId as string
					);
					return { content: [{ type: "text", text: JSON.stringify(verdict, null, 2) }] };
				}
				case "mem_compare": {
					const comparison = await memoryService.compareMemories(
						args?.model as string,
						args?.memoryId1 as string,
						args?.memoryId2 as string
					);
					return { content: [{ type: "text", text: JSON.stringify(comparison, null, 2) }] };
				}
				case "mem_stats": {
					const stats = await memoryService.getStats(args?.project as string);
					return { content: [{ type: "text", text: JSON.stringify(stats, null, 2) }] };
				}
				default:
					return { content: [{ type: "text", text: `Tool ${name} implemented but handler missing.` }] };
			}
		} catch (error: any) {
			return { content: [{ type: "text", text: `Error: ${error.message}` }], isError: true };
		}
	});

	const transport = new StdioServerTransport();
	await mcpServer.connect(transport);
	// IMPORTANTE: En stdio transport no podemos usar console.log porque rompe la comunicacion JSON-RPC.
	// Redirigimos el log a console.error que no interfiere con el canal stdout.
	console.error(`[Brain MCP] MCP Server running on Stdio`);

	// 3. Iniciar Servidor Express (API para Frontend)
	const app = express();
	app.use(cors());
	app.use(express.json());

	app.get("/api/memory/stats", async (req, res) => {
		const project = (req.query.project as string) || "lallamastation";
		try {
			const stats = await memoryService.getStats(project);
			res.json(stats);
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.get("/api/memory/search", async (req, res) => {
		const q = (req.query.q as string) || "";
		const project = (req.query.project as string) || "lallamastation";
		const mode = (req.query.mode as "lexical" | "semantic" | "hybrid") || "hybrid";
		try {
			const results =
				q.trim() === ""
					? await memoryService.getContext(project, 50)
					: await memoryService.searchMemories(q, project, mode, 50);
			res.json(results);
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.delete("/api/memory/:id", async (req, res) => {
		try {
			const success = await memoryService.deleteMemory(req.params.id);
			if (success) res.json({ message: "Memory deleted" });
			else res.status(404).json({ error: "Memory not found" });
		} catch (e: any) {
			res.status(500).json({ error: e.message });
		}
	});

	app.listen(PORT, () => {
		console.error(`[Brain UI API] Dashboard API listening on port ${PORT}`);
	});
}

bootstrap().catch((err) => {
	console.error("[Fatal]", err);
	process.exit(1);
});
